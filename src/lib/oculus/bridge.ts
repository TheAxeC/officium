export type Place = {
    root: string;
    path: string;
};

export type LibraryFiles = {
    readFile(place: Place): Promise<Uint8Array>;
    readDirectory(place: Place): Promise<[string, number][]>;
    stat(place: Place): Promise<unknown>;
};

export type OculusBridge = {
    fs: LibraryFiles;
    getState(): Promise<unknown>;
    setState(value: unknown): Promise<void>;
    open(target: { file: Place & { page?: number } }): Promise<void>;
};
