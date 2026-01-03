export declare const ROLE_TAG_MULTS: {
    readonly vorschlag: {
        readonly tech: 1.5;
        readonly analysis: 1.4;
        readonly logic: 1.3;
        readonly investigation: 1.2;
        readonly perception: 1.1;
        readonly precision: 1;
        readonly visual: 1;
        readonly combat: 0.9;
        readonly strength: 0.8;
        readonly social: 0.9;
        readonly empathy: 0.9;
        readonly drama: 0.9;
        readonly mystic: 1;
        readonly caution: 1.1;
    };
    readonly valkyrie: {
        readonly tech: 1.2;
        readonly analysis: 1.2;
        readonly logic: 1.1;
        readonly investigation: 1.1;
        readonly perception: 1.1;
        readonly precision: 1;
        readonly visual: 1;
        readonly combat: 0.9;
        readonly strength: 0.9;
        readonly social: 1.2;
        readonly empathy: 1.5;
        readonly drama: 1.1;
        readonly mystic: 1.1;
        readonly caution: 1.2;
    };
    readonly ghost: {
        readonly tech: 0.8;
        readonly analysis: 1;
        readonly logic: 0.9;
        readonly investigation: 1.2;
        readonly perception: 1.2;
        readonly precision: 1.5;
        readonly visual: 1.3;
        readonly combat: 1.2;
        readonly strength: 0.8;
        readonly social: 0.9;
        readonly empathy: 0.8;
        readonly drama: 0.8;
        readonly mystic: 0.9;
        readonly caution: 1.1;
    };
    readonly shustrya: {
        readonly tech: 0.5;
        readonly analysis: 0.8;
        readonly logic: 0.7;
        readonly investigation: 1;
        readonly perception: 0.9;
        readonly precision: 0.9;
        readonly visual: 0.9;
        readonly combat: 1.2;
        readonly strength: 1.5;
        readonly social: 1.5;
        readonly empathy: 1.2;
        readonly drama: 1.5;
        readonly mystic: 1.2;
        readonly caution: 0.9;
    };
};
export declare const COOP_STATUSES: {
    readonly fog_madness: {
        readonly label: "Fog Madness";
        readonly defaultTurns: 2;
        readonly mods: {
            readonly 'tag:logic': 0.8;
            readonly 'tag:will': 0.5;
        };
    };
    readonly blind: {
        readonly label: "Blind";
        readonly defaultTurns: 1;
        readonly mods: {
            readonly 'tag:visual': 0;
            readonly 'tag:perception': 0.5;
            readonly 'tag:precision': 0.5;
        };
    };
    readonly stimulated: {
        readonly label: "Stimulated";
        readonly defaultTurns: 2;
        readonly mods: {
            readonly 'tag:reaction': 1.2;
            readonly 'tag:focus': 1.2;
        };
    };
    readonly adrenaline: {
        readonly label: "Adrenaline";
        readonly defaultTurns: 1;
        readonly mods: {
            readonly 'tag:reaction': 1.2;
            readonly 'tag:precision': 0.9;
        };
    };
    readonly injured: {
        readonly label: "Injured";
        readonly defaultTurns: 2;
        readonly mods: {
            readonly 'tag:combat': 0.8;
            readonly 'tag:strength': 0.8;
            readonly 'tag:reaction': 0.9;
        };
    };
    readonly tremor: {
        readonly label: "Tremor";
        readonly defaultTurns: 2;
        readonly mods: {
            readonly 'tag:precision': 0.8;
            readonly 'tag:tech': 0.8;
        };
    };
    readonly dust_cloud: {
        readonly label: "Dust Cloud";
        readonly defaultTurns: 2;
        readonly mods: {
            readonly 'tag:visual': 0.8;
            readonly 'tag:perception': 0.8;
        };
    };
    readonly scanner_overload: {
        readonly label: "Scanner Overload";
        readonly defaultTurns: 1;
        readonly mods: {
            readonly 'tag:tech': 0;
            readonly 'tag:analysis': 0;
        };
    };
};
