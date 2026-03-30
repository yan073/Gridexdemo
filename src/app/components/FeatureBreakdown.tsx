import { FileText } from "lucide-react";
import { useState } from "react";

interface FeatureBreakdownProps {
  selectedFileObj?: {
    id: string;
    filename: string;
    spec: string;
    regions: Array<{
      id: number;
      T: string;
      F: string;
      P: string;
      explanation: string;
    }>;
  };
}

export function FeatureBreakdown({ selectedFileObj }: FeatureBreakdownProps) {
  const regions = selectedFileObj?.regions || [];

  const renderExplanation = (text: string) => {
    const parts = text.split(/(<T>|<\/T>|<F>|<\/F>|<P>|<\/P>)/);
    const result: JSX.Element[] = [];
    let currentTag = '';

    parts.forEach((part, index) => {
      if (part === '<T>') {
        currentTag = 'T';
      } else if (part === '</T>') {
        currentTag = '';
      } else if (part === '<F>') {
        currentTag = 'F';
      } else if (part === '</F>') {
        currentTag = '';
      } else if (part === '<P>') {
        currentTag = 'P';
      } else if (part === '</P>') {
        currentTag = '';
      } else if (part) {
        let className = '';
        if (currentTag === 'T') {
          className = 'text-xs font-semibold px-2 py-0.5 rounded bg-blue-200 text-blue-800';
        } else if (currentTag === 'F') {
          className = 'text-xs font-semibold px-2 py-0.5 rounded bg-green-200 text-green-800';
        } else if (currentTag === 'P') {
          className = 'text-xs font-semibold px-2 py-0.5 rounded bg-purple-200 text-purple-800';
        }

        result.push(
          <span key={index} className={className}>
            {part}
          </span>
        );
      }
    });

    return result;
  };

  return (
    <div className="bg-white border-2 border-black rounded-2xl p-4 shadow-sm">
      <h3 className="font-bold mb-3 text-sm">Spoof Artifact Analysis by Region</h3>
      
      <div className="space-y-2">
        {regions.map((region) => (
          <div key={region.id} className="bg-gray-50 border border-gray-300 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <div className="flex gap-2 items-start flex-shrink-0">
                <span className="text-sm font-bold">Region {region.id}:</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-200 text-blue-800">
                  timing: {region.T}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-200 text-green-800">
                  frequency: {region.F}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-200 text-purple-800">
                  phonetic: {region.P}
                </span>
              </div>
            </div>
            <p className="text-sm mt-2 text-gray-700">
              {renderExplanation(region.explanation)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}