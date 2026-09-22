<script lang="ts">
    import type { RitualDocument } from '$lib/data/model';
    import type { TextCatalog } from '$lib/data/text';
    import { isRoleContribution } from '$lib/reader/contributions';
    import SourceLink from './SourceLink.svelte';

    let {
        document,
        roleId,
        currentId,
        text,
        onopensource
    }: {
        document: RitualDocument;
        roleId: string;
        currentId: string | null;
        text: TextCatalog;
        onopensource?: (documentId: string) => void;
    } = $props();

    const roleLabels = $derived(new Map(document.roles.map((role) => [role.id, role.label])));
</script>

<article class="document" aria-label={document.title}>
    <header class="document-heading">
        <p>{text['reader.ritual']}</p>
        <h1>{document.title}</h1>
    </header>
    {#each document.sections as section (section.id)}
        <section id={`section-${section.id}`} class="document-section">
            <h2>{section.title}</h2>
            {#each section.entries as entry (entry.id)}
                <div
                    id={`entry-${entry.id}`}
                    class:contribution={isRoleContribution(entry, roleId)}
                    class:current={entry.id === currentId}
                    class:speech={entry.kind === 'speech'}
                    class:action={entry.kind === 'action'}
                    class:direction={entry.kind === 'direction'}
                    class:text-entry={entry.kind === 'text'}
                    class="document-entry"
                >
                    <div class="entry-meta">
                        <span class="entry-identification">
                            {#if entry.kind === 'speech'}
                                <strong class="entry-kind">{text['reader.speech']}</strong>
                            {:else if entry.kind === 'action'}
                                <strong class="entry-kind">{text['reader.action']}</strong>
                                <span class="entry-role"
                                    >{entry.roles
                                        .map((role) => roleLabels.get(role))
                                        .join(', ')}</span
                                >
                            {:else if entry.kind === 'direction'}
                                <strong class="entry-kind">{text['reader.direction']}</strong>
                            {:else}
                                <strong class="entry-kind">{text['reader.text']}</strong>
                            {/if}
                            {#if isRoleContribution(entry, roleId)}
                                <span class="contribution-badge">{text['reader.contribution']}</span
                                >
                            {/if}
                        </span>
                        <SourceLink
                            documentId={document.id}
                            source={entry.source}
                            {text}
                            onopen={onopensource}
                        />
                    </div>
                    <div class:speech-body={entry.kind === 'speech'} class="entry-body">
                        {#if entry.kind === 'speech'}
                            <strong class="speech-role">{roleLabels.get(entry.speaker)}</strong>
                        {/if}
                        <div class="entry-content">
                            {#each entry.content as part, partIndex (partIndex)}
                                {#if part.type === 'text'}
                                    <span class="entry-text">{part.text}</span>
                                {:else}
                                    <img
                                        class:block-image={part.display === 'block'}
                                        class:inline-image={part.display === 'inline'}
                                        src={part.runtimeUrl ??
                                            `/api/entry-image/${document.id}/${entry.id}/${partIndex}`}
                                        alt={part.alt}
                                    />
                                {/if}
                            {/each}
                        </div>
                    </div>
                </div>
            {/each}
        </section>
    {/each}
</article>
