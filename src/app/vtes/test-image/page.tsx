'use client';
import Image from 'next/image';

export default function TestImagePage() {
    return (
        <div className="p-10 space-y-4 bg-slate-900 min-h-screen">
            <h1 className="text-white">Next/Image Proxy Test</h1>
            <div className="flex gap-4">
                <div>
                    <p className="text-white mb-2">WebP (DOM Sup)</p>
                    <Image
                        id="img-proxy"
                        src="https://static.krcg.org/webp/disc/sup/dom.webp"
                        width={100}
                        height={100}
                        alt="test proxy"
                        onError={(e) => console.error('Proxy Error', e)}
                    />
                </div>
                <div>
                    <p className="text-white mb-2">SVG (AUS Inf)</p>
                    <Image
                        id="img-proxy-svg"
                        src="https://static.krcg.org/svg/disc/inf/aus.svg"
                        width={100}
                        height={100}
                        alt="test svg"
                        onError={(e) => console.error('Proxy SVG Error', e)}
                    />
                </div>
            </div>
        </div>
    );
}
