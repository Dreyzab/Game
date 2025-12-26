declare module 'react-qr-code' {
    import * as React from 'react';

    export interface QRCodeProps {
        value: string;
        size?: number;
        viewBox?: string;
        bgColor?: string;
        fgColor?: string;
        level?: 'L' | 'M' | 'Q' | 'H';
        title?: string;
        style?: React.CSSProperties;
    }

    const QRCode: React.FC<QRCodeProps>;
    export default QRCode;
}
