<script lang="ts">
    import type { CatechismDocument } from '$lib/data/model';
    import type { TextCatalog } from '$lib/data/text';
    import SourceLink from './SourceLink.svelte';

    let {
        document,
        currentId,
        text,
        onopensource
    }: {
        document: CatechismDocument;
        currentId: string | null;
        text: TextCatalog;
        onopensource?: (documentId: string) => void;
    } = $props();
</script>

<article class="document" aria-label={document.title}>
    <header class="document-heading">
        <p>{text['reader.catechism']}</p>
        <h1>{document.title}</h1>
    </header>
    {#each document.sections as section (section.id)}
        <section id={`section-${section.id}`} class="document-section">
            <h2>{section.title}</h2>
            {#each section.blocks as block (block.id)}
                {#if block.kind === 'text'}
                    <div class="catechism-text">
                        <div class="entry-meta">
                            <strong>{text['reader.text']}</strong>
                            <SourceLink
                                documentId={document.id}
                                source={block.source}
                                {text}
                                onopen={onopensource}
                            />
                        </div>
                        <p>{block.text}</p>
                    </div>
                {:else if block.kind === 'prompt'}
                    <div
                        id={`entry-${block.id}`}
                        class:current={block.id === currentId}
                        class="catechism-pair catechism-prompt"
                    >
                        <div class="entry-meta">
                            <strong>{text['reader.question']}</strong>
                            <SourceLink
                                documentId={document.id}
                                source={block.source}
                                {text}
                                onopen={onopensource}
                            />
                        </div>
                        <p class="question">{block.text}</p>
                    </div>
                {:else}
                    <div
                        id={`entry-${block.id}`}
                        class:current={block.id === currentId}
                        class="catechism-pair"
                    >
                        <div class="entry-meta">
                            <strong>{text['reader.question']}</strong>
                            <SourceLink
                                documentId={document.id}
                                source={block.source}
                                {text}
                                onopen={onopensource}
                            />
                        </div>
                        <p class="question">{block.question}</p>
                        <strong class="answer-label">{text['reader.answer']}</strong>
                        {#if block.answer !== undefined}
                            <p>{block.answer}</p>
                        {:else}
                            <img
                                class="catechism-answer-image"
                                src={block.answerImageUrl ??
                                    `/api/answer-image/${document.id}/${block.id}`}
                                alt=""
                            />
                        {/if}
                    </div>
                {/if}
            {/each}
        </section>
    {/each}
</article>
