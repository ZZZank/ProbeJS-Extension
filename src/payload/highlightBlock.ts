export interface HighlighBlock {
    id: string;
    properties: { [key: string]: string };
    data: { [key: string]: any };
    components: { [key: string]: any };
    pos: {
        x: number;
        y: number;
        z: number;
    },
    dimension: string;
}

export function toPropertyString(block: HighlighBlock): string[] {
    let properties = [];
    for (let key in block.properties) {
        properties.push(`${key}=${block.properties[key]}`);
    }
    return properties;
}