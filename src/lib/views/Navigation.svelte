<script lang="ts">
    import type { TextCatalog } from '$lib/data/text';
    import type { NavigationItem } from '$lib/reader/contributions';

    let {
        items,
        currentId,
        catechism,
        open,
        disabled,
        text,
        onselect
    }: {
        items: NavigationItem[];
        currentId: string | null;
        catechism: boolean;
        open: boolean;
        disabled: boolean;
        text: TextCatalog;
        onselect: (itemId: string) => void;
    } = $props();
</script>

<aside
    class="navigation"
    class:open
    aria-label={catechism ? text['reader.questions'] : text['reader.contributions']}
>
    <header class="navigation-heading">
        <h2>{catechism ? text['reader.questions'] : text['reader.contributions']}</h2>
        <span>{items.length}</span>
    </header>
    {#if items.length === 0}
        <p class="empty-message">{text['reader.empty']}</p>
    {:else}
        <ol>
            {#each items as item (item.id)}
                <li>
                    <button
                        class:current={item.id === currentId}
                        data-kind={item.kind}
                        type="button"
                        {disabled}
                        aria-current={item.id === currentId ? 'location' : undefined}
                        onclick={() => onselect(item.id)}
                    >
                        <span class="navigation-mark" aria-hidden="true"></span>
                        <span class="navigation-copy">
                            <strong>{item.sectionTitle}</strong>
                            <span>{item.label}</span>
                        </span>
                        <small>
                            {#if item.source.printedPage !== undefined}
                                {text['reader.page_short']} {item.source.printedPage}
                            {:else}
                                {text['reader.pdf_page_short']} {item.source.pdfPage}
                            {/if}
                        </small>
                    </button>
                </li>
            {/each}
        </ol>
    {/if}
</aside>
