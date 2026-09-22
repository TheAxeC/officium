<script lang="ts">
    import { onMount } from 'svelte';
    import type { OfficiumDocument, RitualDocument } from '$lib/data/model';
    import type { TextCatalog } from '$lib/data/text';
    import { navigationItems } from '$lib/reader/contributions';
    import { readReaderState, writeReaderState } from '$lib/reader/state';
    import CatechismDocument from './CatechismDocument.svelte';
    import Navigation from './Navigation.svelte';
    import RitualDocumentView from './RitualDocument.svelte';

    let {
        documents,
        text,
        onchangelibrary,
        onopensource
    }: {
        documents: OfficiumDocument[];
        text: TextCatalog;
        onchangelibrary?: () => void;
        onopensource?: (documentId: string) => void;
    } = $props();

    let documentId = $state('');
    let roleId = $state<string | null>(null);
    let currentId = $state<string | null>(null);
    let sectionId = $state('');
    let indexOpen = $state(false);
    let ready = $state(false);

    const selectedDocument = $derived(
        documents.find((item) => item.id === documentId) ?? documents[0]
    );
    const items = $derived(selectedDocument ? navigationItems(selectedDocument, roleId) : []);
    const currentIndex = $derived(items.findIndex((item) => item.id === currentId));

    onMount(() => {
        const stored = readReaderState(localStorage);
        if (stored && documents.some((item) => item.id === stored.documentId)) {
            documentId = stored.documentId;
            const restoredDocument = documents.find((item) => item.id === stored.documentId);
            roleId = validRole(restoredDocument, stored.roleId);
            const restoredItems = restoredDocument ? navigationItems(restoredDocument, roleId) : [];
            currentId = restoredItems.some((item) => item.id === stored.itemId)
                ? stored.itemId
                : null;
            sectionId =
                restoredItems.find((item) => item.id === currentId)?.sectionId ??
                restoredDocument?.sections[0]?.id ??
                '';
        } else {
            documentId = documents[0]?.id ?? '';
            roleId = firstRole(documents[0]);
            sectionId = documents[0]?.sections[0]?.id ?? '';
        }
        ready = true;
    });

    $effect(() => {
        if (ready) {
            writeReaderState(localStorage, { documentId, roleId, itemId: currentId });
        }
    });

    function selectDocument(nextDocumentId: string): void {
        documentId = nextDocumentId;
        const nextDocument = documents.find((item) => item.id === nextDocumentId);
        roleId = firstRole(nextDocument);
        currentId = null;
        sectionId = nextDocument?.sections[0]?.id ?? '';
        indexOpen = false;
    }

    function selectRole(nextRoleId: string): void {
        roleId = nextRoleId;
        currentId = null;
        indexOpen = false;
    }

    function selectItem(itemId: string): void {
        currentId = itemId;
        sectionId = items.find((item) => item.id === itemId)?.sectionId ?? sectionId;
        indexOpen = false;
        requestAnimationFrame(() => {
            window.document.getElementById(`entry-${itemId}`)?.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        });
    }

    function selectSection(nextSectionId: string): void {
        sectionId = nextSectionId;
        requestAnimationFrame(() => {
            window.document.getElementById(`section-${nextSectionId}`)?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
    }

    function move(offset: number): void {
        if (items.length === 0) {
            return;
        }
        const base = currentIndex === -1 ? (offset > 0 ? -1 : items.length) : currentIndex;
        const nextIndex = Math.max(0, Math.min(items.length - 1, base + offset));
        selectItem(items[nextIndex].id);
    }

    function firstRole(value: OfficiumDocument | undefined): string | null {
        return value?.documentType === 'ritual' ? (value.roles[0]?.id ?? null) : null;
    }

    function validRole(
        value: OfficiumDocument | undefined,
        candidate: string | null
    ): string | null {
        if (value?.documentType !== 'ritual') {
            return null;
        }
        return value.roles.some((role) => role.id === candidate) ? candidate : firstRole(value);
    }
</script>

<div class="app-shell" inert={!ready} aria-busy={!ready}>
    <header class="app-header">
        <div class="wordmark">{text['app.title']}</div>
        <label class="selector">
            <span>{text['reader.document']}</span>
            <select
                value={documentId}
                disabled={!ready}
                onchange={(event) => selectDocument(event.currentTarget.value)}
            >
                {#each documents as item (item.id)}
                    <option value={item.id}>{item.title}</option>
                {/each}
            </select>
        </label>
        {#if selectedDocument?.documentType === 'ritual'}
            <label class="selector">
                <span>{text['reader.role']}</span>
                <select
                    value={roleId ?? ''}
                    disabled={!ready}
                    onchange={(event) => selectRole(event.currentTarget.value)}
                >
                    {#each selectedDocument.roles as role (role.id)}
                        <option value={role.id}>{role.label}</option>
                    {/each}
                </select>
            </label>
        {/if}
        <div class="header-spacer"></div>
        {#if onchangelibrary !== undefined}
            <button class="library-change" type="button" onclick={onchangelibrary}>
                {text['library.change']}
            </button>
        {/if}
        <div class="header-progress">
            {currentIndex === -1 ? 0 : currentIndex + 1}
            {text['reader.of']}
            {items.length}
            {(selectedDocument?.documentType === 'catechism'
                ? text['reader.questions']
                : text['reader.contributions']
            ).toLocaleLowerCase('nl')}
        </div>
        <button
            class="index-toggle"
            type="button"
            aria-expanded={indexOpen}
            onclick={() => (indexOpen = !indexOpen)}
        >
            {indexOpen
                ? text['reader.close']
                : selectedDocument?.documentType === 'catechism'
                  ? text['reader.questions']
                  : text['reader.contributions']}
        </button>
    </header>

    {#if selectedDocument}
        <div class="reader-layout">
            <Navigation
                {items}
                {currentId}
                catechism={selectedDocument.documentType === 'catechism'}
                open={indexOpen}
                disabled={!ready}
                {text}
                onselect={selectItem}
            />
            <main class="reading-pane">
                <nav
                    class="step-controls"
                    aria-label={selectedDocument.documentType === 'catechism'
                        ? text['reader.questions']
                        : text['reader.contributions']}
                >
                    <button
                        type="button"
                        aria-label={text['reader.previous']}
                        title={text['reader.previous']}
                        onclick={() => move(-1)}
                        disabled={!ready || items.length === 0 || currentIndex <= 0}
                    >
                        &uarr;
                    </button>
                    <span>{currentIndex === -1 ? 0 : currentIndex + 1} / {items.length}</span>
                    <button
                        type="button"
                        aria-label={text['reader.next']}
                        title={text['reader.next']}
                        onclick={() => move(1)}
                        disabled={!ready || items.length === 0 || currentIndex === items.length - 1}
                    >
                        &darr;
                    </button>
                </nav>
                {#if selectedDocument.sections.length > 1}
                    <nav class="section-controls" aria-label={text['reader.section']}>
                        <label>
                            <span>{text['reader.section']}</span>
                            <select
                                value={sectionId}
                                disabled={!ready}
                                onchange={(event) => selectSection(event.currentTarget.value)}
                            >
                                {#each selectedDocument.sections as section (section.id)}
                                    <option value={section.id}>{section.title}</option>
                                {/each}
                            </select>
                        </label>
                    </nav>
                {/if}
                {#if selectedDocument.documentType === 'ritual'}
                    <RitualDocumentView
                        document={selectedDocument as RitualDocument}
                        roleId={roleId ?? ''}
                        {currentId}
                        {text}
                        {onopensource}
                    />
                {:else}
                    <CatechismDocument
                        document={selectedDocument}
                        {currentId}
                        {text}
                        {onopensource}
                    />
                {/if}
            </main>
        </div>
    {/if}
</div>
