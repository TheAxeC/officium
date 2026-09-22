import type {
    CatechismDocument,
    OfficiumDocument,
    RitualDocument,
    RitualEntry,
    SourcePage
} from '$lib/data/model';

export type NavigationItem = {
    id: string;
    sectionId: string;
    sectionTitle: string;
    label: string;
    kind: 'speech' | 'action' | 'question';
    source: SourcePage;
};

export function navigationItems(
    document: OfficiumDocument,
    roleId: string | null
): NavigationItem[] {
    if (document.documentType === 'catechism') {
        return catechismQuestions(document);
    }
    if (roleId === null) {
        return [];
    }
    return roleContributions(document, roleId);
}

export function isRoleContribution(entry: RitualEntry, roleId: string): boolean {
    if (entry.kind === 'speech') {
        return entry.speaker === roleId;
    }
    if (entry.kind === 'action') {
        return entry.roles.includes(roleId);
    }
    return false;
}

function roleContributions(document: RitualDocument, roleId: string): NavigationItem[] {
    return document.sections.flatMap((section) =>
        section.entries
            .filter((entry) => isRoleContribution(entry, roleId))
            .map((entry) => ({
                id: entry.id,
                sectionId: section.id,
                sectionTitle: section.title,
                label: entry.text,
                kind: entry.kind as 'speech' | 'action',
                source: entry.source
            }))
    );
}

function catechismQuestions(document: CatechismDocument): NavigationItem[] {
    return document.sections.flatMap((section) =>
        section.blocks.flatMap((block) =>
            block.kind === 'pair' || block.kind === 'prompt'
                ? [
                      {
                          id: block.id,
                          sectionId: section.id,
                          sectionTitle: section.title,
                          label: block.kind === 'pair' ? block.question : block.text,
                          kind: 'question' as const,
                          source: block.source
                      }
                  ]
                : []
        )
    );
}
