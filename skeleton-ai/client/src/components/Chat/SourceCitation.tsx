interface SourceCitationProps {
  index: number;
  filePath?: string;
  onClick?: () => void;
}

export default function SourceCitation({ index, filePath, onClick }: SourceCitationProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-brand-600 bg-brand-100 hover:bg-brand-200 rounded-full cursor-pointer transition-colors mx-0.5 align-super"
      title={filePath || `Source ${index}`}
    >
      {index}
    </button>
  );
}
