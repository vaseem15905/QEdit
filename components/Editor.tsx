"use client";

import { useState } from "react";
import Image from "next/image";
import { PaperData, Question, Section, PageSettings } from "@/types";
import QuestionForm from "./QuestionForm";
import Preview from "./Preview";
import Modal from "./ui/Modal";
import { Printer, Trash2, Pencil, Settings, RotateCcw, Plus, ChevronDown, ChevronUp } from "lucide-react";

const formatDateDDMMYYYY = (dateStr: string) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}-${m}-${y}`;
};

const initialPaperData: PaperData = {
  header: {
    institutionName: "",
    college: "",
    department: "",
    examName: "",
    subject: "",
    courseCode: "",
    class: "",
    semester: "",
    date: new Date().toISOString().split('T')[0],
    duration: "",
    totalMarks: 100,
    logo: "/srm.png",
  },
  sections: [
    {
      id: "sec-1",
      title: "Part-A",
      part: "A",
      requiredCount: "ALL",
      defaultMarks: 2,
      questions: [],
    },
  ],
  settings: {
    marginTop: 15,
    marginBottom: 15,
    marginLeft: 15,
    marginRight: 15,
    fontSize: 12,
    lineHeight: 1.5,
  }
};

export default function Editor() {
  const [paperData, setPaperData] = useState<PaperData>(initialPaperData);
  const [activeSectionId, setActiveSectionId] = useState<string>(initialPaperData.sections[0].id);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showPageSetup, setShowPageSetup] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [showBlCoPo, setShowBlCoPo] = useState(true);
  const [showWatermark, setShowWatermark] = useState(false);
  const [showLogo, setShowLogo] = useState(true);
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.04);
  const [autoCapitalize, setAutoCapitalize] = useState(true);
  const [allCaps, setAllCaps] = useState(false);
  const calculatedTotalMarks = paperData.sections.reduce(
    (acc, section) => acc + section.questions.reduce((qAcc, q) => qAcc + q.marks, 0),
    0
  );

  const handleHeaderChange = (field: keyof typeof paperData.header, value: string | number) => {
    setPaperData((prev) => ({
      ...prev,
      header: { ...prev.header, [field]: value },
    }));
  };

  const updateSettings = (field: keyof PageSettings, value: any) => {
      setPaperData(prev => ({
          ...prev,
          settings: {
              ...prev.settings!,
              [field]: value
          }
      }));
  };

  const resetSettings = () => {
      setPaperData(prev => ({
          ...prev,
          settings: initialPaperData.settings
      }));
  };

  const addSection = () => {
    const existingParts = paperData.sections.map(s => s.part);
    let nextPart = "A";
    for (let i = 0; i < 7; i++) {
        const char = String.fromCharCode(65 + i);
        if (!existingParts.includes(char)) {
            nextPart = char;
            break;
        }
    }

    const newSection: Section = {
      id: crypto.randomUUID(),
      part: nextPart,
      requiredCount: "ALL",
      defaultMarks: 2,
      questions: [],
    };
    setPaperData((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
    setActiveSectionId(newSection.id);
    setShowSectionModal(true);
  };

  const handleEditSection = (sectionId: string) => {
      setActiveSectionId(sectionId);
      setShowSectionModal(true);
  };

  const updateSectionField = (sectionId: string, field: keyof Section, value: any) => {
      setPaperData(prev => ({
          ...prev,
          sections: prev.sections.map(sec => 
              sec.id === sectionId ? { ...sec, [field]: value } : sec
          )
      }));
  };

  const moveQuestion = (sectionId: string, index: number, direction: 'up' | 'down') => {
      setPaperData(prev => {
          const newSections = prev.sections.map(sec => {
              if (sec.id === sectionId) {
                  const newQuestions = [...sec.questions];
                  if (direction === 'up' && index > 0) {
                       [newQuestions[index], newQuestions[index - 1]] = [newQuestions[index - 1], newQuestions[index]];
                  } else if (direction === 'down' && index < newQuestions.length - 1) {
                       [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];
                  }
                  return { ...sec, questions: newQuestions };
              }
              return sec;
          });
          return { ...prev, sections: newSections };
      });
  };

  const deleteSection = (sectionId: string) => {
    if (paperData.sections.length === 1) return;
    setPaperData((prev) => {
      const newSections = prev.sections.filter((s) => s.id !== sectionId);
      return { ...prev, sections: newSections };
    });
    if (activeSectionId === sectionId) {
        setActiveSectionId(paperData.sections[0].id);
    }
    setShowSectionModal(false);
  };

  const addQuestion = (question: Question) => {
    if (editingQuestion) {
      setPaperData((prev) => ({
        ...prev,
        sections: prev.sections.map((sec) => {
          if (sec.id === activeSectionId) {
            return {
              ...sec,
              questions: sec.questions.map((q) => (q.id === editingQuestion.id ? question : q)),
            };
          }
          return sec;
        }),
      }));
      setEditingQuestion(null);
    } else {
      setPaperData((prev) => ({
        ...prev,
        sections: prev.sections.map((sec) => {
          if (sec.id === activeSectionId) {
            return { ...sec, questions: [...sec.questions, question] };
          }
          return sec;
        }),
      }));
    }
    setShowQuestionModal(false);
  };

  const handleAddQuestion = (sectionId: string) => {
      setActiveSectionId(sectionId);
      setEditingQuestion(null);
      setShowQuestionModal(true);
  };

  const editQuestion = (question: Question, sectionId: string) => {
    setActiveSectionId(sectionId);
    setEditingQuestion(question);
    setShowQuestionModal(true);
  };

  const cancelEdit = () => {
    setEditingQuestion(null);
  };

  const deleteQuestion = (sectionId: string, questionId: string) => {
    setPaperData((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) => {
        if (sec.id === sectionId) {
          return { ...sec, questions: sec.questions.filter((q) => q.id !== questionId) };
        }
        return sec;
      }),
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex h-screen overflow-hidden print:overflow-visible print:h-auto" style={{ background: '#f0f7f4' }}>
      {/* Left Panel - Editor */}
      <div className="w-1/2 flex flex-col h-full print:hidden" style={{ borderRight: '1px solid #e2e5ea' }}>
        <header className="px-5 py-3 flex justify-between items-center sticky top-0 z-10" style={{ background: '#fff', borderBottom: '1px solid #e2e5ea' }}>
          <div className="flex items-center gap-3">
            <div>
              <Image src="/logo.png" alt="Qedit" width={120} height={32} className="h-8 w-auto" priority />
              <p className="text-[9px] text-center mt-0.5" style={{ color: '#b0b5be', letterSpacing: '0.5px' }}>Crafted with💚 by Chan&apos;s Team</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
                onClick={() => setShowPageSetup(!showPageSetup)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors"
                style={{
                  background: showPageSetup ? '#e8f5ee' : '#fff',
                  color: showPageSetup ? '#2a7d5f' : '#4b5563',
                  border: `1px solid ${showPageSetup ? '#a7d7c5' : '#d1d5db'}`,
                }}
            >
                <Settings size={15} /> Page Setup
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-white transition-colors"
              style={{ background: '#2a7d5f' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#2a7d5f')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#2a7d5f')}
            >
              <Printer size={15} /> Save as PDF
            </button>
          </div>
        </header>



        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Header Details Form */}
          <div className="p-4 rounded-lg space-y-4" style={{ background: '#fff', border: '1px solid #e2e5ea' }}>
              <div className="flex justify-between items-center pb-2" style={{ borderBottom: '1px solid #f1f3f6' }}>
                  <div className="flex items-center gap-4">
                    <h3 className="font-semibold text-sm" style={{ color: '#374151' }}>Header Details</h3>
                    <div className="flex items-center gap-2">
                         <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md" style={{ background: '#f8f9fb', border: '1px solid #e2e5ea' }}>
                            <label className="text-[10px] font-medium" style={{ color: '#6b7280' }}>Auto Caps</label>
                            <button type="button" onClick={() => setAutoCapitalize(!autoCapitalize)} className="relative w-6 h-3.5 rounded-full transition-colors" style={{ background: autoCapitalize ? '#2a7d5f' : '#d1d5db' }}>
                                <span className="absolute top-0.5 rounded-full w-2.5 h-2.5 bg-white transition-all shadow-sm" style={{ left: autoCapitalize ? '12px' : '2px' }} />
                            </button>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md" style={{ background: '#f8f9fb', border: '1px solid #e2e5ea' }}>
                            <label className="text-[10px] font-medium" style={{ color: '#6b7280' }}>ALL CAPS</label>
                            <button type="button" onClick={() => setAllCaps(!allCaps)} className="relative w-6 h-3.5 rounded-full transition-colors" style={{ background: allCaps ? '#2a7d5f' : '#d1d5db' }}>
                                <span className="absolute top-0.5 rounded-full w-2.5 h-2.5 bg-white transition-all shadow-sm" style={{ left: allCaps ? '12px' : '2px' }} />
                            </button>
                        </div>
                    </div>
                  </div>
                  <button onClick={() => setHeaderCollapsed(!headerCollapsed)} className="p-1 rounded transition-colors" style={{ color: '#9ca3af' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#374151')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                  >
                    {headerCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                  </button>
             </div>
             {!headerCollapsed && (
             <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Institution Name</label>
                    <input type="text" value={paperData.header.institutionName} onChange={(e) => { let v = e.target.value; if (autoCapitalize) v = v.replace(/\b\w/g, c => c.toUpperCase()); if (allCaps) v = v.toUpperCase(); handleHeaderChange('institutionName', v); }} placeholder="e.g. SRM Institute of Science and Technology" className="w-full p-2 text-sm rounded-md" style={{ border: '1px solid #d1d5db', color: '#1a1a2e', textTransform: allCaps ? 'uppercase' : 'none' }} />
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>College</label>
                    <input type="text" value={paperData.header.college || ''} onChange={(e) => { let v = e.target.value; if (autoCapitalize) v = v.replace(/\b\w/g, c => c.toUpperCase()); if (allCaps) v = v.toUpperCase(); handleHeaderChange('college', v); }} placeholder="e.g. Faculty of Science and Humanities" className="w-full p-2 text-sm rounded-md" style={{ border: '1px solid #d1d5db', color: '#1a1a2e', textTransform: allCaps ? 'uppercase' : 'none' }} />
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Department</label>
                    <input type="text" value={paperData.header.department || ''} onChange={(e) => { let v = e.target.value; if (autoCapitalize) v = v.replace(/\b\w/g, c => c.toUpperCase()); if (allCaps) v = v.toUpperCase(); handleHeaderChange('department', v); }} placeholder="e.g. Department of Computer Applications" className="w-full p-2 text-sm rounded-md" style={{ border: '1px solid #d1d5db', color: '#1a1a2e', textTransform: allCaps ? 'uppercase' : 'none' }} />
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Exam Name</label>
                    <input type="text" value={paperData.header.examName} onChange={(e) => { let v = e.target.value; if (autoCapitalize) v = v.replace(/\b\w/g, c => c.toUpperCase()); if (allCaps) v = v.toUpperCase(); handleHeaderChange('examName', v); }} placeholder="e.g. Model Examination" className="w-full p-2 text-sm rounded-md" style={{ border: '1px solid #d1d5db', color: '#1a1a2e', textTransform: allCaps ? 'uppercase' : 'none' }} />
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Course Code</label>
                    <input type="text" value={paperData.header.courseCode || ''} onChange={(e) => { let v = e.target.value; if (allCaps) v = v.toUpperCase(); handleHeaderChange('courseCode', v); }} placeholder="e.g. UCS2401" className="w-full p-2 text-sm rounded-md" style={{ border: '1px solid #d1d5db', color: '#1a1a2e', textTransform: allCaps ? 'uppercase' : 'none' }} />
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Subject</label>
                    <input type="text" value={paperData.header.subject} onChange={(e) => { let v = e.target.value; if (autoCapitalize) v = v.replace(/\b\w/g, c => c.toUpperCase()); if (allCaps) v = v.toUpperCase(); handleHeaderChange('subject', v); }} placeholder="e.g. Data Structures" className="w-full p-2 text-sm rounded-md" style={{ border: '1px solid #d1d5db', color: '#1a1a2e', textTransform: allCaps ? 'uppercase' : 'none' }} />
                </div>
                <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Class</label>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={(() => { const c = paperData.header.class || ''; const parts = c.split(' '); return parts[0] || ''; })()}
                        onChange={(e) => {
                          const current = (paperData.header.class || '').split(' ');
                          current[0] = e.target.value;
                          handleHeaderChange('class', current.filter(Boolean).join(' '));
                        }}
                        className="p-2 text-sm rounded-md"
                        style={{ border: '1px solid #d1d5db', color: '#1a1a2e' }}
                      >
                        <option value="">Year</option>
                        <option value="I">I</option>
                        <option value="II">II</option>
                        <option value="III">III</option>
                        <option value="IV">IV</option>
                        <option value="V">V</option>
                      </select>
                      <select
                        value={(() => { const c = paperData.header.class || ''; const parts = c.split(' '); return parts[1] || ''; })()}
                        onChange={(e) => {
                          const current = (paperData.header.class || '').split(' ');
                          current[1] = e.target.value;
                          handleHeaderChange('class', current.filter(Boolean).join(' '));
                        }}
                        className="p-2 text-sm rounded-md"
                        style={{ border: '1px solid #d1d5db', color: '#1a1a2e' }}
                      >
                        <option value="">Course</option>
                        <option value="BCA">BCA</option>
                        <option value="BSc">BSc</option>
                        <option value="BA">BA</option>
                        <option value="BBA">BBA</option>
                        <option value="BCom">BCom</option>
                        <option value="BE">BE</option>
                        <option value="BTech">BTech</option>
                        <option value="MCA">MCA</option>
                        <option value="MSc">MSc</option>
                        <option value="MBA">MBA</option>
                        <option value="ME">ME</option>
                        <option value="MTech">MTech</option>
                      </select>
                      <input
                        type="text"
                        value={(() => { const c = paperData.header.class || ''; const parts = c.split(' '); return parts.slice(2).join(' ') || ''; })()}
                        onChange={(e) => {
                          const current = (paperData.header.class || '').split(' ');
                          const year = current[0] || '';
                          const course = current[1] || '';
                          handleHeaderChange('class', [year, course, e.target.value].filter(Boolean).join(' '));
                        }}
                        placeholder="Spec (DS, CS...)"
                        className="p-2 text-sm rounded-md"
                        style={{ border: '1px solid #d1d5db', color: '#1a1a2e' }}
                      />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Semester</label>
                    <select value={paperData.header.semester || ''} onChange={(e) => handleHeaderChange('semester', e.target.value)} className="w-full p-2 text-sm rounded-md" style={{ border: '1px solid #d1d5db', color: '#1a1a2e' }}>
                        <option value="">Select</option>
                        <option value="ODD">ODD</option>
                        <option value="EVEN">EVEN</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Reg No. Boxes</label>
                    <input type="number" min="5" max="20" value={paperData.header.regNoBoxCount || 15} onChange={(e) => handleHeaderChange('regNoBoxCount', Math.min(20, Math.max(5, parseInt(e.target.value) || 15)))} className="w-full p-2 text-sm rounded-md" style={{ border: '1px solid #d1d5db', color: '#1a1a2e' }} />
                </div>
                <div className="col-span-2 flex gap-4">
                    <div className="flex-1">
                        <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Date</label>
                        <input type="date" value={paperData.header.date} onChange={(e) => handleHeaderChange('date', e.target.value)} className="w-full p-2 text-sm rounded-md" style={{ border: '1px solid #d1d5db', color: '#1a1a2e' }} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Duration</label>
                        <div className="flex gap-2 w-auto">
                      <select
                        value={(() => { const d = paperData.header.duration || ''; const m = d.match(/(\d+)\s*Hour/i); return m ? m[1] : ''; })()}
                        onChange={(e) => {
                          const d = paperData.header.duration || '';
                          const minsMatch = d.match(/(\d+)\s*Min/i);
                          const mins = minsMatch ? minsMatch[1] : '';
                          const hrs = e.target.value;
                          let formatted = '';
                          if (hrs) formatted += `${hrs} Hour${parseInt(hrs) > 1 ? 's' : ''}`;
                          if (mins) formatted += ` ${mins} Mins`;
                          handleHeaderChange('duration', formatted.trim());
                        }}
                        className="p-2 text-sm rounded-md"
                        style={{ border: '1px solid #d1d5db', color: '#1a1a2e' }}
                      >
                        <option value="">Hrs</option>
                        {[1,2,3,4,5].map(h => <option key={h} value={h}>{h} Hr{h > 1 ? 's' : ''}</option>)}
                      </select>
                      <select
                        value={(() => { const d = paperData.header.duration || ''; const m = d.match(/(\d+)\s*Min/i); return m ? m[1] : ''; })()}
                        onChange={(e) => {
                          const d = paperData.header.duration || '';
                          const hrsMatch = d.match(/(\d+)\s*Hour/i);
                          const hrs = hrsMatch ? hrsMatch[1] : '';
                          const mins = e.target.value;
                          let formatted = '';
                          if (hrs) formatted += `${hrs} Hour${parseInt(hrs) > 1 ? 's' : ''}`;
                          if (mins) formatted += ` ${mins} Mins`;
                          handleHeaderChange('duration', formatted.trim());
                        }}
                        className="p-2 text-sm rounded-md"
                        style={{ border: '1px solid #d1d5db', color: '#1a1a2e' }}
                      >
                        <option value="">Mins</option>
                        <option value="15">15 Min</option>
                        <option value="30">30 Min</option>
                        <option value="45">45 Min</option>
                      </select>
                    </div>
                </div>
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Total Marks</label>
                    <input type="number" value={paperData.header.totalMarks} onChange={(e) => handleHeaderChange('totalMarks', parseInt(e.target.value))} className="w-full p-2 text-sm rounded-md" style={{ border: '1px solid #d1d5db', color: '#1a1a2e' }} />
                </div>
                <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Institution Logo</label>
                    <div className="flex items-center gap-3">
                      {paperData.header.logo && (
                        <img src={paperData.header.logo} alt="Logo" className="h-10 w-10 object-contain rounded" style={{ filter: 'grayscale(100%)', border: '1px solid #e2e5ea' }} />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              handleHeaderChange('logo', ev.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:cursor-pointer"
                        style={{ color: '#6b7280' }}
                      />
                      {paperData.header.logo && paperData.header.logo !== '/srm.png' && (
                        <button
                          type="button"
                          onClick={() => handleHeaderChange('logo', '/srm.png')}
                          className="text-xs transition-colors"
                          style={{ color: '#9ca3af' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#2a7d5f')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                        >
                          Reset
                        </button>
                      )}
                      {paperData.header.logo && (
                        <button
                          type="button"
                          onClick={() => handleHeaderChange('logo', '')}
                          className="text-xs transition-colors"
                          style={{ color: '#9ca3af' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                </div>
             </div>
             )}
          </div>

          <button onClick={addSection} className="w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 text-sm transition-colors" 
            style={{ 
              background: '#fff', 
              color: '#2a7d5f', 
              border: '1px dashed #a7d7c5',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#e8f5ee'; e.currentTarget.style.borderStyle = 'solid'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderStyle = 'dashed'; }}
          >
                 <Plus size={15} /> Add New Part
          </button>

          {/* Question List Management - All Sections */}
          <div className="space-y-5">
            {paperData.sections.map((section) => (
                <div key={section.id} 
                    className="p-4 rounded-lg transition-shadow"
                    style={{ 
                      background: activeSectionId === section.id ? '#f0f9f5' : '#f7faf8', 
                      border: activeSectionId === section.id ? '1.5px solid #2a7d5f' : '1px solid #d4e5dc',
                      boxShadow: activeSectionId === section.id ? '0 0 0 2px rgba(42, 125, 95, 0.08)' : 'none',
                    }}
                    onClick={() => setActiveSectionId(section.id)}
                >
                    <div className="flex justify-between items-center mb-3 pb-2" style={{ borderBottom: '1px solid #f1f3f6' }}>
                          <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-sm" style={{ color: '#374151' }}>
                                  Part {section.part} <span className="font-normal text-xs ml-1" style={{ color: '#6b7280' }}>({section.requiredCount === 'ALL' ? 'Answer ALL' : `Answer any ${section.requiredCount}`})</span>
                              </h3>
                             <button 
                                onClick={(e) => { e.stopPropagation(); handleEditSection(section.id); }}
                                className="p-1 rounded transition-colors"
                                style={{ color: '#9ca3af' }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = '#2a7d5f')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                                title="Edit Section Settings"
                             >
                                <Settings size={14} />
                             </button>
                         </div>
                         <div className="flex gap-1.5">
                           <button 
                               onClick={(e) => {
                                   e.stopPropagation();
                                   const newBreak: Question = {
                                       id: crypto.randomUUID(),
                                       text: "--- PAGE BREAK ---",
                                       marks: 0,
                                       type: 'break'
                                   };
                                   addQuestion(newBreak); 
                               }}
                               className="text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors"
                               style={{ background: '#f1f3f6', color: '#6b7280', border: '1px solid #e2e5ea' }}
                               onMouseEnter={(e) => (e.currentTarget.style.background = '#e2e5ea')}
                               onMouseLeave={(e) => (e.currentTarget.style.background = '#f1f3f6')}
                               title="Insert Page Break"
                           >
                               <span className="font-mono font-bold text-[10px]">BR</span> Break
                           </button>
                           <button 
                               onClick={(e) => {
                                   e.stopPropagation();
                                   handleAddQuestion(section.id);
                               }}
                               className="text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors"
                               style={{ background: '#e8f5ee', color: '#2a7d5f', border: '1px solid #a7d7c5' }}
                               onMouseEnter={(e) => (e.currentTarget.style.background = '#d1eddf')}
                               onMouseLeave={(e) => (e.currentTarget.style.background = '#e8f5ee')}
                           >
                               <Plus size={12} /> Add Question
                           </button>
                         </div>
                    </div>
                    
                    <ul className="space-y-1.5 text-sm">
                        {section.questions.map((q, i) => (
                            <li 
                                key={q.id} 
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('sectionId', section.id);
                                    e.dataTransfer.setData('questionIndex', i.toString());
                                }}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const sourceSectionId = e.dataTransfer.getData('sectionId');
                                    const sourceIndex = parseInt(e.dataTransfer.getData('questionIndex'));
                                    
                                    if (sourceSectionId === section.id && sourceIndex !== i) {
                                        const newQuestions = [...section.questions];
                                        const [moved] = newQuestions.splice(sourceIndex, 1);
                                        newQuestions.splice(i, 0, moved);
                                        updateSectionField(section.id, 'questions', newQuestions);
                                    }
                                }}
                                className="flex justify-between items-start pb-1.5 cursor-move rounded px-1.5 py-1 transition-colors"
                                style={{
                                  borderBottom: '1px solid #f5f6f8',
                                  background: editingQuestion?.id === q.id ? '#e8f5ee' : q.type === 'break' ? '#f8f9fb' : 'transparent',
                                }}
                            >
                                <div className="flex flex-col gap-0.5 mr-2 mt-0.5">
                                    <button onClick={(e) => { e.stopPropagation(); moveQuestion(section.id, i, 'up'); }} disabled={i === 0} className="disabled:opacity-20 transition-colors" style={{ color: '#9ca3af' }}
                                      onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.color = '#2a7d5f'; }}
                                      onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                                    >▲</button>
                                    <button onClick={(e) => { e.stopPropagation(); moveQuestion(section.id, i, 'down'); }} disabled={i === section.questions.length - 1} className="disabled:opacity-20 transition-colors" style={{ color: '#9ca3af' }}
                                      onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.color = '#2a7d5f'; }}
                                      onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                                    >▼</button>
                                </div>
                                {q.type === 'break' ? (
                                    <div className="flex-1 text-center font-mono text-xs uppercase tracking-widest" style={{ color: '#9ca3af' }}>--- Page Break ---</div>
                                ) : (
                                    <span className="truncate flex-1 pt-0.5" style={{ color: '#1a1a2e' }}>
                                        {section.questions.filter((x, idx) => idx < i && x.type !== 'break').length + 1}. {q.text}
                                    </span>
                                )}
                                <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                                    {q.type !== 'break' && <span className="font-mono text-[11px] px-1 rounded" style={{ background: '#f1f3f6', color: '#6b7280' }}>[{q.marks}]</span>}
                                    {q.type !== 'break' && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); editQuestion(q, section.id); }}
                                        className="p-1 rounded transition-colors"
                                        style={{ color: '#9ca3af' }}
                                        onMouseEnter={(e) => (e.currentTarget.style.color = '#2a7d5f')}
                                        onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                                        title="Edit Question"
                                    >
                                        <Pencil size={13} />
                                    </button>
                                    )}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); deleteQuestion(section.id, q.id); }}
                                        className="p-1 rounded transition-colors"
                                        style={{ color: '#c4c9d1' }}
                                        onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
                                        onMouseLeave={(e) => (e.currentTarget.style.color = '#c4c9d1')}
                                        title="Delete Question"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </li>
                        ))}
                        {section.questions.length === 0 && (
                            <li className="italic text-center py-3 text-sm" style={{ color: '#9ca3af' }}>No questions in this section. Click &quot;Add Question&quot; to start.</li>
                        )}
                    </ul>
                </div>
            ))}
          </div>

        </div>

        {/* Modals */}
        <Modal
            isOpen={showPageSetup}
            onClose={() => setShowPageSetup(false)}
            title="Page Setup"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9ca3af' }}>Display Options</h4>
              <div className="flex items-center justify-between py-2 px-3 rounded-md" style={{ background: '#f8f9fb', border: '1px solid #e2e5ea' }}>
                  <label className="text-sm" style={{ color: '#374151' }}>Show BL / CO / PO columns</label>
                  <button type="button" onClick={() => setShowBlCoPo(!showBlCoPo)} className="relative w-9 h-5 rounded-full transition-colors" style={{ background: showBlCoPo ? '#2a7d5f' : '#d1d5db' }}>
                    <span className="absolute top-0.5 rounded-full w-4 h-4 bg-white transition-all shadow-sm" style={{ left: showBlCoPo ? '18px' : '2px' }} />
                  </button>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-md" style={{ background: '#f8f9fb', border: '1px solid #e2e5ea' }}>
                  <label className="text-sm" style={{ color: '#374151' }}>Show Institution Logo</label>
                  <button type="button" onClick={() => setShowLogo(!showLogo)} className="relative w-9 h-5 rounded-full transition-colors" style={{ background: showLogo ? '#2a7d5f' : '#d1d5db' }}>
                    <span className="absolute top-0.5 rounded-full w-4 h-4 bg-white transition-all shadow-sm" style={{ left: showLogo ? '18px' : '2px' }} />
                  </button>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-md" style={{ background: '#f8f9fb', border: '1px solid #e2e5ea' }}>
                  <label className="text-sm" style={{ color: '#374151' }}>Logo Watermark on Pages</label>
                  <button type="button" onClick={() => setShowWatermark(!showWatermark)} className="relative w-9 h-5 rounded-full transition-colors" style={{ background: showWatermark ? '#2a7d5f' : '#d1d5db' }}>
                    <span className="absolute top-0.5 rounded-full w-4 h-4 bg-white transition-all shadow-sm" style={{ left: showWatermark ? '18px' : '2px' }} />
                  </button>
              </div>
              {showWatermark && (
              <div className="flex items-center gap-3 py-2 px-3 rounded-md" style={{ background: '#f8f9fb', border: '1px solid #e2e5ea' }}>
                  <label className="text-sm shrink-0" style={{ color: '#374151' }}>Watermark Opacity</label>
                  <input type="range" min="0.01" max="0.15" step="0.01" value={watermarkOpacity} onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))} className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer" style={{ accentColor: '#2a7d5f' }} />
                  <span className="text-xs font-mono w-8 text-right" style={{ color: '#6b7280' }}>{Math.round(watermarkOpacity * 100)}%</span>
              </div>
              )}

            </div>

            <div style={{ borderTop: '1px solid #e2e5ea', paddingTop: '16px' }}>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#9ca3af' }}>Layout Settings</h4>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Line Spacing</label>
                      <input type="number" min="1.0" max="3.0" step="0.1" value={paperData.settings?.lineHeight || 1.5} onChange={(e) => updateSettings('lineHeight', parseFloat(e.target.value))} className="w-full p-2 text-sm rounded-md" style={{ border: '1px solid #d1d5db', color: '#1a1a2e', background: '#fff' }} />
                  </div>
                  <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Font Size (pt)</label>
                      <input type="number" min="8" max="24" value={paperData.settings?.fontSize || 12} onChange={(e) => updateSettings('fontSize', parseInt(e.target.value))} className="w-full p-2 text-sm rounded-md" style={{ border: '1px solid #d1d5db', color: '#1a1a2e', background: '#fff' }} />
                  </div>
                  <div className="col-span-2">
                      <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Margins (mm)</label>
                      <div className="grid grid-cols-4 gap-2">
                           <input title="Top" type="number" placeholder="Top" value={paperData.settings?.marginTop} onChange={(e) => updateSettings('marginTop', parseInt(e.target.value))} className="p-2 text-sm rounded-md" style={{ border: '1px solid #d1d5db', color: '#1a1a2e', background: '#fff' }} />
                           <input title="Bottom" type="number" placeholder="Bottom" value={paperData.settings?.marginBottom} onChange={(e) => updateSettings('marginBottom', parseInt(e.target.value))} className="p-2 text-sm rounded-md" style={{ border: '1px solid #d1d5db', color: '#1a1a2e', background: '#fff' }} />
                           <input title="Left" type="number" placeholder="Left" value={paperData.settings?.marginLeft} onChange={(e) => updateSettings('marginLeft', parseInt(e.target.value))} className="p-2 text-sm rounded-md" style={{ border: '1px solid #d1d5db', color: '#1a1a2e', background: '#fff' }} />
                           <input title="Right" type="number" placeholder="Right" value={paperData.settings?.marginRight} onChange={(e) => updateSettings('marginRight', parseInt(e.target.value))} className="p-2 text-sm rounded-md" style={{ border: '1px solid #d1d5db', color: '#1a1a2e', background: '#fff' }} />
                      </div>
                  </div>
              </div>
            </div>

            <div className="pt-3 flex justify-between items-center" style={{ borderTop: '1px solid #e2e5ea' }}>
                <button onClick={resetSettings} className="text-xs flex items-center gap-1 transition-colors" style={{ color: '#6b7280' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#374151')} onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}>
                    <RotateCcw size={12} /> Reset Defaults
                </button>
                <button onClick={() => setShowPageSetup(false)} className="text-white px-4 py-2 rounded-md text-sm transition-colors" style={{ background: '#2a7d5f' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#236b50')} onMouseLeave={(e) => (e.currentTarget.style.background = '#2a7d5f')}>
                    Done
                </button>
            </div>
          </div>
        </Modal>

        <Modal
            isOpen={showSectionModal}
            onClose={() => setShowSectionModal(false)}
            title={`Configuration: Part ${paperData.sections.find(s => s.id === activeSectionId)?.part || ''}`}
        >
             <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Part Name</label>
                            <select
                            value={paperData.sections.find(s => s.id === activeSectionId)?.part || 'A'}
                            onChange={(e) => updateSectionField(activeSectionId, 'part', e.target.value)}
                            className="w-full p-2 text-sm rounded-md"
                            style={{ border: '1px solid #d1d5db', color: '#1a1a2e', background: '#fff' }}
                            >
                            {Array.from({ length: 7 }).map((_, i) => {
                                const char = String.fromCharCode(65 + i);
                                return <option key={char} value={char}>{char}</option>;
                            })}
                            </select>
                    </div>
                    <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Questions to Answer</label>
                            <select
                            value={paperData.sections.find(s => s.id === activeSectionId)?.requiredCount || 'ALL'}
                            onChange={(e) => updateSectionField(activeSectionId, 'requiredCount', e.target.value)}
                            className="w-full p-2 text-sm rounded-md"
                            style={{ border: '1px solid #d1d5db', color: '#1a1a2e', background: '#fff' }}
                            >
                            <option value="ALL">Answer ALL</option>
                            {Array.from({ length: 15 }).map((_, i) => (
                                <option key={i+1} value={(i+1).toString()}>{i+1}</option>
                            ))}
                            </select>
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Default Marks per Question</label>
                    <input
                            type="number"
                            min="1"
                            placeholder="e.g. 2"
                            value={paperData.sections.find(s => s.id === activeSectionId)?.defaultMarks || ''}
                            onChange={(e) => updateSectionField(activeSectionId, 'defaultMarks', parseInt(e.target.value) || undefined)}
                            className="w-full p-2 text-sm rounded-md"
                            style={{ border: '1px solid #d1d5db', color: '#1a1a2e', background: '#fff' }}
                        />
                </div>

                <div className="pt-4 flex justify-between items-center" style={{ borderTop: '1px solid #e2e5ea' }}>
                    <button 
                        onClick={() => deleteSection(activeSectionId)}
                        disabled={paperData.sections.length === 1}
                        className="px-3 py-2 rounded-md text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        style={{ color: '#dc2626' }}
                        onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#fef2f2'; }}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                        <Trash2 size={15} /> Delete Section
                    </button>
                    <button 
                        onClick={() => setShowSectionModal(false)}
                        className="text-white px-4 py-2 rounded-md text-sm transition-colors"
                        style={{ background: '#2a7d5f' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#236b50')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#2a7d5f')}
                    >
                        Done
                    </button>
                </div>
             </div>
        </Modal>

        <Modal
            isOpen={showQuestionModal}
            onClose={() => setShowQuestionModal(false)}
            title={editingQuestion ? "Edit Question" : "Add New Question"}
        >
             <QuestionForm 
                onAddQuestion={addQuestion} 
                editingQuestion={editingQuestion} 
                onCancelEdit={() => setShowQuestionModal(false)} 
                sectionDefaultMarks={paperData.sections.find(s => s.id === activeSectionId)?.defaultMarks}
                showBlCoPo={showBlCoPo}
                autoCapitalize={autoCapitalize}
                allCaps={allCaps}
              />
        </Modal>
      </div>

      {/* Right Panel - Preview */}
      <div className="w-1/2 h-full overflow-y-auto p-8 flex justify-center print:w-full print:bg-white print:p-0 print:overflow-visible" style={{ background: '#eceef2' }}>
        <Preview data={paperData} showBlCoPo={showBlCoPo} showWatermark={showWatermark} showLogo={showLogo} watermarkOpacity={watermarkOpacity} />
      </div>
    </div>
  );
}
