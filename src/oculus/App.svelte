<script lang="ts">
    import { onMount } from 'svelte';
    import { parse } from 'yaml';
    import type { OfficiumDocument } from '$lib/data/model';
    import type { TextCatalog } from '$lib/data/text';
    import { validateTextCatalog } from '$lib/data/text';
    import { ownRootKey } from '$lib/oculus/address';
    import type { OculusBridge } from '$lib/oculus/bridge';
    import { connectBridge } from '$lib/oculus/connect';
    import { loadOculusLibrary, sourcePlace, type OculusLibrary } from '$lib/oculus/library';
    import {
        parseReaderState,
        serializeReaderState,
        type ReaderStateStore
    } from '$lib/reader/state';
    import Reader from '$lib/views/Reader.svelte';
    import textSource from '../../config/text.yml?raw';

    const text: TextCatalog = validateTextCatalog(parse(textSource), 'config/text.yml');
    let documents = $state<OfficiumDocument[]>([]);
    let loading = $state(true);
    let loadError = $state<string | null>(null);
    let notice = $state<string | null>(null);
    let stateStore = $state<ReaderStateStore | undefined>(undefined);
    let sourceOpener = $state<((documentId: string, pdfPage: number) => void) | undefined>(
        undefined
    );

    onMount(async () => {
        try {
            const connected = await connectBridge();
            const root = ownRootKey(window.location.pathname);
            const library = await loadOculusLibrary(connected.fs, root);
            const saved = parseReaderState(await connected.getState());
            stateStore = { read: () => saved, write: (state) => saveState(connected, state) };
            sourceOpener = (documentId, pdfPage) =>
                void openSource(connected, root, library, documentId, pdfPage);
            documents = library.documents;
        } catch (error) {
            loadError = error instanceof Error ? error.message : String(error);
        } finally {
            loading = false;
        }
    });

    function saveState(connected: OculusBridge, state: Parameters<ReaderStateStore['write']>[0]) {
        connected.setState(serializeReaderState(state)).catch((word: unknown) => {
            notice = `${text['oculus.state_failed']}: ${String(word)}`;
        });
    }

    async function openSource(
        connected: OculusBridge,
        root: string,
        library: OculusLibrary,
        documentId: string,
        pdfPage: number
    ): Promise<void> {
        try {
            const document = library.documents.find((item) => item.id === documentId);
            if (document === undefined) throw new Error(`unknown document ${documentId}`);
            await connected.open({
                file: sourcePlace(root, library, document.source.file, pdfPage)
            });
        } catch (word) {
            notice = `${text['oculus.source_failed']}: ${String(word)}`;
        }
    }
</script>

<svelte:head>
    <title>{text['app.title']}</title>
</svelte:head>

{#if loading}
    <main class="library-screen" aria-busy="true">{text['library.loading']}</main>
{:else if documents.length > 0}
    {#if notice !== null}
        <p class="oculus-notice" role="alert">
            {notice}
            <button type="button" onclick={() => (notice = null)}>{text['reader.close']}</button>
        </p>
    {/if}
    <Reader {documents} {text} onopensource={sourceOpener} {stateStore} />
{:else}
    <main class="library-screen">
        <section>
            <h1>{loadError === null ? text['library.none_title'] : text['library.error_title']}</h1>
            <p>{loadError ?? text['oculus.none_body']}</p>
        </section>
    </main>
{/if}
