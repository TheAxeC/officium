<script lang="ts">
    import { onMount } from 'svelte';
    import { parse } from 'yaml';
    import type { OfficiumDocument } from '$lib/data/model';
    import type { TextCatalog } from '$lib/data/text';
    import { validateTextCatalog } from '$lib/data/text';
    import {
        bundledLibraryRoot,
        chooseLibraryRoot,
        isDesktop,
        loadDesktopDocuments,
        openDesktopSource,
        rememberedLibraryRoot,
        rememberLibraryRoot
    } from '$lib/desktop/library';
    import Reader from '$lib/views/Reader.svelte';
    import textSource from '../../config/text.yml?raw';

    const text: TextCatalog = validateTextCatalog(parse(textSource), 'config/text.yml');
    const desktop = isDesktop();
    let documents = $state<OfficiumDocument[]>([]);
    let libraryRoot = $state<string | null>(null);
    let loading = $state(true);
    let loadError = $state<string | null>(null);

    onMount(async () => {
        if (desktop) {
            const remembered = await rememberedLibraryRoot();
            const bundled = await bundledLibraryRoot();
            if (remembered !== null) {
                await loadLibrary(remembered);
            } else if (bundled !== null) {
                await loadLibrary(bundled);
            } else {
                loading = false;
            }
            return;
        }
        try {
            const response = await fetch('/api/catalogue');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            documents = (await response.json()) as OfficiumDocument[];
        } catch (error) {
            loadError = error instanceof Error ? error.message : String(error);
        } finally {
            loading = false;
        }
    });

    async function selectLibrary(): Promise<void> {
        const selected = await chooseLibraryRoot();
        if (selected !== null) {
            await loadLibrary(selected);
            if (loadError === null) await rememberLibraryRoot(selected);
        }
    }

    async function loadLibrary(root: string): Promise<void> {
        loading = true;
        loadError = null;
        try {
            const loaded = await loadDesktopDocuments(root);
            if (loaded.length === 0) throw new Error('Geen YAML-documenten gevonden.');
            documents = loaded;
            libraryRoot = root;
        } catch (error) {
            documents = [];
            libraryRoot = null;
            loadError = error instanceof Error ? error.message : String(error);
        } finally {
            loading = false;
        }
    }

    async function openSource(documentId: string): Promise<void> {
        if (libraryRoot === null) return;
        const document = documents.find((item) => item.id === documentId);
        if (document !== undefined) {
            await openDesktopSource(libraryRoot, document.source.file);
        }
    }
</script>

<svelte:head>
    <title>{text['app.title']}</title>
    <meta name="description" content={text['app.subtitle']} />
</svelte:head>

{#if loading}
    <main class="library-screen" aria-busy="true">{text['library.loading']}</main>
{:else if documents.length > 0}
    <Reader
        {documents}
        {text}
        onchangelibrary={desktop ? selectLibrary : undefined}
        onopensource={desktop ? openSource : undefined}
    />
{:else}
    <main class="library-screen">
        <section>
            <h1>{loadError === null ? text['library.none_title'] : text['library.error_title']}</h1>
            <p>{loadError ?? text['library.none_body']}</p>
            {#if desktop}
                <button type="button" onclick={selectLibrary}>{text['library.choose']}</button>
            {/if}
        </section>
    </main>
{/if}
