<script lang="ts">
    import { resolve } from '$app/paths';
    import type { SourcePage } from '$lib/data/model';
    import type { TextCatalog } from '$lib/data/text';

    let {
        documentId,
        source,
        text,
        onopen
    }: {
        documentId: string;
        source: SourcePage;
        text: TextCatalog;
        onopen?: (documentId: string) => void;
    } = $props();

    const sourceHref = $derived(
        `${resolve('/api/source/[document]', { document: documentId })}#page=${source.pdfPage}`
    );
    const pagePrefix = $derived(
        source.printedPage === undefined ? text['reader.pdf_page_short'] : text['reader.page_short']
    );
    const pageLabel = $derived(source.printedPage ?? String(source.pdfPage));
</script>

{#if onopen === undefined}
    <a
        class="source-link"
        href={sourceHref}
        target="_blank"
        rel="noreferrer"
        aria-label={`${text['reader.source']}, ${pagePrefix} ${pageLabel}`}
    >
        {pagePrefix}
        {pageLabel}
    </a>
{:else}
    <button
        class="source-link source-button"
        type="button"
        aria-label={`${text['reader.source']}, ${pagePrefix} ${pageLabel}`}
        onclick={() => onopen(documentId)}
    >
        {pagePrefix}
        {pageLabel}
    </button>
{/if}
