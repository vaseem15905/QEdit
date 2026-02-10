import { PaperData, Question, Section } from "@/types";
import React from "react";

interface PreviewProps {
  data: PaperData;
  showBlCoPo?: boolean;
  showWatermark?: boolean;
  showLogo?: boolean;
  watermarkOpacity?: number;
}

const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}-${m}-${y}`;
};

export default function Preview({ data, showBlCoPo, showWatermark, showLogo, watermarkOpacity = 0.04 }: PreviewProps) {
  const renderContent = () => {
    const pages: React.ReactNode[][] = [[]];
    let currentPageIndex = 0;

    const addToCurrentPage = (node: React.ReactNode) => {
        pages[currentPageIndex].push(node);
    };

    const addNewPage = () => {
        pages.push([]);
        currentPageIndex++;
    };

    const regBoxCount = data.header.regNoBoxCount || 15;

    // Add Header to first page
    addToCurrentPage(
      <div key="header" className="mb-6 relative">
        {/* Absolutely positioned logo */}
        {showLogo && data.header.logo && (
          <img 
            src={data.header.logo} 
            alt="Institution Logo" 
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '60px', 
              height: '60px', 
              objectFit: 'contain',
              filter: 'grayscale(100%)',
            }}
          />
        )}
        
        <div className="text-center">
          <h1 className="text-xl font-bold uppercase tracking-wide leading-tight">{data.header.institutionName}</h1>
          {data.header.college && <h2 className="text-lg font-bold uppercase leading-tight">{data.header.college}</h2>}
          {data.header.department && <h2 className="text-md font-bold uppercase leading-tight">{data.header.department}</h2>}
          <h2 className="text-md font-bold uppercase leading-tight">{data.header.examName}</h2>
          <h3 className="text-md font-bold uppercase leading-tight mb-2">
              {data.header.courseCode && <span>{data.header.courseCode} – </span>}
              {data.header.subject}
          </h3>
        </div>
        
        <div className="flex justify-between items-start mt-2 pb-2">
             <div className="flex flex-col text-left">
                <span className="font-bold">Class: {data.header.class}</span>
                <span className="font-bold">Semester: {data.header.semester}</span>
             </div>
             <div className="flex flex-col items-end">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold">Date: {formatDateDisplay(data.header.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-bold">Reg. No:</span>
                    <div className="flex border border-black bg-white">
                        {Array.from({ length: regBoxCount }).map((_, i) => (
                            <div key={i} className="w-5 h-6 border-r last:border-r-0 border-black flex items-center justify-center font-mono font-bold text-xs">
                                {data.header.registerNumber ? data.header.registerNumber[i] || "" : ""}
                            </div>
                        ))}
                    </div>
                </div>
             </div>
        </div>

        <div className="flex justify-between font-bold mt-2">
           <span>Duration: {data.header.duration}</span>
           <span>Max. Marks: {data.header.totalMarks}</span>
        </div>
      </div>
    );

    // Process Sections
    data.sections.forEach((section, secIndex) => {
        addToCurrentPage(
            <div key={`sec-${section.id}-header`} className="mb-4">
                <div className="flex justify-between items-baseline mb-2 mt-4 border-b border-black pb-1">
                     <div className="flex items-baseline gap-2">
                        <h4 className="font-bold text-lg uppercase">Part {section.part}</h4>
                        <span className="text-sm font-bold">
                            ({section.requiredCount === 'ALL' ? 'Answer ALL questions' : `Answer any ${section.requiredCount} questions`})
                        </span>
                     </div>
                     {section.defaultMarks !== undefined && (
                        <div className="text-sm font-bold">
                            <span>({section.requiredCount === 'ALL' ? section.questions.filter(q => q.type !== 'break').length : section.requiredCount} x {section.defaultMarks} = {(section.requiredCount === 'ALL' ? section.questions.filter(q => q.type !== 'break').length : parseInt(section.requiredCount)) * section.defaultMarks} Marks)</span>
                        </div>
                     )}
                </div>
                 {showBlCoPo && (
                 <div className="flex font-bold mb-2 text-right text-xs">
                    <div className="flex-1 text-left"></div> 
                    <div className="w-8 text-center">BL</div>
                    <div className="w-8 text-center">CO</div>
                    <div className="w-8 text-center">PO</div>
                </div>
                 )}
            </div>
        );

        let infoQIndex = 0;
        section.questions.forEach((question) => {
            if (question.type === 'break') {
                addNewPage();
            } else {
                infoQIndex++;
                addToCurrentPage(
                    <div key={question.id} className="flex gap-2 mb-3 break-inside-avoid">
                        <span className="w-6 shrink-0 font-bold">{infoQIndex}.</span>
                        <div className="flex-1">
                            <div className="flex justify-between items-baseline">
                                <div className="text-justify pr-4 flex-1">
                                    <p>
                                        {question.orQuestion && <span className="font-bold mr-2">A.</span>}
                                        {question.text}
                                    </p>
                                    {question.subQuestions && question.subQuestions.length > 0 && (
                                        <div className="mt-1 space-y-1">
                                            {question.subQuestions.map((sub, sIdx) => (
                                                <div key={sub.id} className="flex gap-2 text-sm">
                                                    <span className="w-6 text-right shrink-0">{['i','ii','iii','iv'][sIdx] || sIdx+1})</span>
                                                    <div className="flex-1 flex justify-between">
                                                        <span>{sub.text}</span>
                                                        <span className="text-xs font-mono ml-2 shrink-0 text-gray-600">
                                                            {sub.marks ? `[${sub.marks}]` : ''} 
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {showBlCoPo && (
                                <div className="flex gap-0 shrink-0 text-xs font-mono">
                                    <span className="w-8 text-center block">{question.bl}</span>
                                    <span className="w-8 text-center block">{question.co}</span>
                                    <span className="w-8 text-center block">{question.po}</span>
                                </div>
                                )}
                            </div>
                            
                            {/* OR Question */}
                            {question.orQuestion && (
                                <div className="my-2 text-center text-sm">
                                    <span className="font-bold text-xs uppercase my-1 block">(OR)</span>
                                    <div className="flex justify-between items-baseline text-left font-normal text-base">
                                         <p className="text-justify pr-4 flex-1">
                                            <span className="font-bold mr-2">B.</span>
                                            {question.orQuestion.text}
                                         </p>
                                         {showBlCoPo && (
                                         <div className="flex gap-0 shrink-0 text-xs font-mono">
                                            <span className="w-8 text-center block">{question.orQuestion.bl}</span>
                                            <span className="w-8 text-center block">{question.orQuestion.co}</span>
                                            <span className="w-8 text-center block">{question.orQuestion.po}</span>
                                        </div>
                                         )}
                                    </div>
                                </div>
                            )}

                             {/* MCQ Options */}
                            {question.type === 'mcq' && question.options && (
                                <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-1 ml-4 text-sm">
                                    {question.options.map((opt, i) => (
                                        <div key={i} className="flex gap-1">
                                            <span className="font-bold">({String.fromCharCode(97 + i)})</span>
                                            <span>{opt}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );
            }
        });
    });

    return pages;
  };

  const [scale, setScale] = React.useState(0.75);
  const pagesChunks = renderContent();

  return (
    <div className="flex flex-col items-center relative">
        <div className="space-y-8 print:space-y-0 pb-20 transition-transform origin-top print-reset-transform" style={{ transform: `scale(${scale})` }}>
            {pagesChunks.map((pageContent, pageIndex) => (
                <div 
                    key={pageIndex}
                    className={`bg-white shadow-2xl print:shadow-none print:m-0 mx-auto relative group ${pageIndex < pagesChunks.length - 1 ? 'print:break-after-page break-after-page' : ''}`}
                    style={{
                    width: '210mm',
                    minHeight: '297mm',
                    paddingTop: `${data.settings?.marginTop ?? 15}mm`,
                    paddingBottom: `${data.settings?.marginBottom ?? 15}mm`,
                    paddingLeft: `${data.settings?.marginLeft ?? 15}mm`,
                    paddingRight: `${data.settings?.marginRight ?? 15}mm`,
                    boxSizing: 'border-box',
                    fontSize: `${data.settings?.fontSize ?? 12}pt`,
                    lineHeight: data.settings?.lineHeight || 1.5,
                    fontFamily: '"Times New Roman", Times, serif',
                    color: '#000',
                    }}
                >
                    {/* Watermark */}
                    {showWatermark && data.header.logo && (
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '200px',
                        height: '200px',
                        opacity: watermarkOpacity,
                        pointerEvents: 'none',
                        zIndex: 0,
                      }}>
                        <img 
                          src={data.header.logo} 
                          alt="" 
                          style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'grayscale(100%)' }}
                        />
                      </div>
                    )}

                    {/* Page Number */}
                    <div className="absolute bottom-2 right-4 text-xs text-gray-400 print:hidden">Page {pageIndex + 1}</div>
                    
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      {pageContent}
                    </div>
                </div>
            ))}
        </div>

        {/* Zoom Control - Fixed bottom-right */}
        <div className="fixed bottom-4 right-6 flex items-center gap-3 px-3 py-2 rounded-lg print:hidden z-20" style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid #e2e5ea', backdropFilter: 'blur(4px)', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <span className="text-xs font-semibold" style={{ color: '#6b7280' }}>Zoom</span>
            <input 
                type="range" 
                min="0.4" 
                max="1.5" 
                step="0.05" 
                value={scale} 
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-24 h-1.5 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: '#2a7d5f' }}
            />
            <span className="text-xs font-mono w-10 text-right" style={{ color: '#4b5563' }}>{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(0.75)} className="text-xs transition-colors" style={{ color: '#2a7d5f' }}>Reset</button>
        </div>
    </div>
  );
}
