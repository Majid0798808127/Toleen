import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface PrintableBarcodeProps {
  barcode: string;
  productName: string;
}

export const PrintableBarcode = React.forwardRef<HTMLDivElement, PrintableBarcodeProps>(
  ({ barcode, productName }, ref) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
      if (svgRef.current && barcode) {
        try {
            JsBarcode(svgRef.current, barcode, {
            format: 'CODE128',
            displayValue: true,
            fontSize: 18,
            textMargin: 0,
            });
        } catch (e) {
            console.error(e);
        }
      }
    }, [barcode]);

    if (!barcode) return null;

    return (
      <div ref={ref} className="p-4 bg-white text-black text-center print:block">
        <h3 className="text-lg font-bold">{productName || 'Product Name'}</h3>
        <svg ref={svgRef}></svg>
      </div>
    );
  }
);

PrintableBarcode.displayName = 'PrintableBarcode';
