import React, { useState, useCallback, useMemo } from 'react';
import { analyzeCv, analyzeFormatting, generateImprovementTips, analyzeStandaloneCv, generateComprehensiveReport } from './services/analysisService';
import { optimizeCvWithGemini, detectJobDomain } from './services/geminiService';
import { readTxtFile, readPdfFile, readDocxFile } from './services/fileReaderService';
import type { AnalysisResult, FormattingResult, StandaloneAnalysisResult } from './types';

type AnalysisMode = 'comparison' | 'standalone';

// --- Icon Components ---
const IconFile = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>;
const IconAnalyze = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>;
const IconOptimize = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>;
const IconCopy = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" /><path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h6a2 2 0 00-2-2H5z" /></svg>;


// --- UI Components ---
const Loader: React.FC<{ message: string }> = ({ message }) => (
    <div className="absolute inset-0 bg-slate-200 bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="flex flex-col items-center text-center p-4">
            <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-slate-700 font-semibold text-lg">{message}</p>
            <p className="text-slate-500">This may take a moment.</p>
        </div>
    </div>
);

const ScoreGauge: React.FC<{ score: number }> = ({ score }) => {
    const getScoreColor = (s: number) => s >= 85 ? 'text-emerald-500' : s >= 70 ? 'text-amber-500' : 'text-red-500';
    const getScoreRingColor = (s: number) => s >= 85 ? 'stroke-emerald-500' : s >= 70 ? 'stroke-amber-500' : 'stroke-red-500';
    const getScoreStatus = (s: number) => s >= 85 ? 'Excellent' : s >= 70 ? 'Good' : s >= 50 ? 'Fair' : 'Needs Work';

    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center w-56 h-56">
            <svg className="w-full h-full" viewBox="0 0 200 200">
                <circle className="text-slate-200" strokeWidth="12" stroke="currentColor" fill="transparent" r={radius} cx="100" cy="100" />
                <circle className={`${getScoreRingColor(score)} transition-all duration-1000 ease-in-out`} strokeWidth="12" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx="100" cy="100" transform="rotate(-90 100 100)" />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className={`text-5xl font-bold ${getScoreColor(score)}`}>{score}<span className="text-2xl">%</span></span>
                <span className={`text-lg font-semibold ${getScoreColor(score)}`}>{getScoreStatus(score)}</span>
                <span className="text-sm text-slate-500">ATS Match</span>
            </div>
        </div>
    );
};

const ProgressBar: React.FC<{ value: number; label: string }> = ({ value, label }) => {
    const getBarColor = (v: number) => v >= 85 ? 'bg-emerald-500' : v >= 70 ? 'bg-amber-500' : 'bg-red-500';
    return (
        <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-slate-600">{label}</span>
                <span className="text-sm font-bold text-slate-800">{value}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5"><div className={`${getBarColor(value)} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${value}%` }}></div></div>
        </div>
    );
};

// --- Main App Component ---
export default function App() {
    const [mode, setMode] = useState<AnalysisMode>('comparison');
    const [jdText, setJdText] = useState('');
    const [cvText, setCvText] = useState('');
    
    const [comparisonResult, setComparisonResult] = useState<AnalysisResult | null>(null);
    const [formattingResult, setFormattingResult] = useState<FormattingResult | null>(null);
    const [standaloneResult, setStandaloneResult] = useState<StandaloneAnalysisResult | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [optimizedCv, setOptimizedCv] = useState<string>('');
    const [activeTab, setActiveTab] = useState('summary');
    const [copySuccess, setCopySuccess] = useState('');

    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setLoadingMessage(`Reading ${file.name}...`);
        setError(null);

        try {
            let content = '';
            const fileExtension = file.name.split('.').pop()?.toLowerCase();

            if (fileExtension === 'pdf') {
                content = await readPdfFile(file);
            } else if (fileExtension === 'docx') {
                content = await readDocxFile(file);
            } else if (fileExtension === 'txt') {
                content = await readTxtFile(file);
            } else {
                throw new Error("Unsupported file type. Please upload a PDF, DOCX, or TXT file.");
            }
            setCvText(content);
        } catch (err: any) {
            setError(err.message || "Failed to read the file. It might be corrupted or protected.");
        } finally {
            setIsLoading(false);
        }
        
        e.target.value = ''; // Reset file input to allow re-uploading the same file
    }, []);

    const handleAnalyze = useCallback(async () => {
        setError(null);
        setComparisonResult(null);
        setStandaloneResult(null);

        if (!cvText) {
            setError("Please provide your CV content.");
            return;
        }

        if (mode === 'comparison') {
            if (!jdText) {
                setError("Please provide the Job Description content for comparison.");
                return;
            }
            setIsLoading(true);
            setLoadingMessage('Detecting job domain...');
            try {
                const domain = await detectJobDomain(jdText);
                setLoadingMessage(`Analyzing CV for ${domain.replace('_', ' ')} role...`);
                const analysis = analyzeCv(cvText, jdText, domain);
                const formatting = analyzeFormatting(cvText);
                setComparisonResult(analysis);
                setFormattingResult(formatting);
                setActiveTab('summary');
            } catch (e: any) {
                setError(e.message || "An unknown error occurred during analysis.");
            } finally {
                setIsLoading(false);
            }
        } else { // Standalone mode
             setIsLoading(true);
             setLoadingMessage('Performing CV Health Check...');
             try {
                const analysis = analyzeStandaloneCv(cvText);
                setStandaloneResult(analysis);
             } catch (e: any) {
                setError(e.message || "An unknown error occurred during analysis.");
             } finally {
                setIsLoading(false);
             }
        }
    }, [cvText, jdText, mode]);

    const handleOptimize = useCallback(async () => {
        if (!cvText || !jdText) {
            setError("Please provide both CV and Job Description to use AI optimization.");
            return;
        }
        setError(null);
        setIsLoading(true);
        setLoadingMessage('AI is optimizing your CV...');
        try {
            const optimized = await optimizeCvWithGemini(cvText, jdText);
            setOptimizedCv(optimized);
            setMode('comparison');
            setActiveTab('optimized');
        } catch (e: any) {
            setError(e.message || "Failed to optimize CV.");
        } finally {
            setIsLoading(false);
        }
    }, [cvText, jdText]);

    const improvementTips = useMemo(() => {
        if (mode === 'comparison' && comparisonResult && formattingResult) {
            return generateImprovementTips(comparisonResult, formattingResult);
        }
        return [];
    }, [mode, comparisonResult, formattingResult]);
    
    const comprehensiveReport = useMemo(() => {
        if (mode === 'comparison' && comparisonResult && formattingResult) {
            return generateComprehensiveReport(comparisonResult, formattingResult);
        }
        return '';
    }, [mode, comparisonResult, formattingResult]);

    const handleCopyReport = () => {
        navigator.clipboard.writeText(comprehensiveReport).then(() => {
            setCopySuccess('Report copied to clipboard!');
            setTimeout(() => setCopySuccess(''), 2000);
        }, () => {
            setCopySuccess('Failed to copy report.');
        });
    };

    const renderComparisonResults = () => {
        if (!comparisonResult || !formattingResult) return <p className="text-slate-500 p-6 text-center">Run an analysis to see detailed results here.</p>;
        const tabs = [ { id: 'summary', label: 'Summary' }, { id: 'report', label: 'Full Report' }, { id: 'skills', label: 'Skills Analysis' }, { id: 'recommendations', label: 'Recommendations' }, { id: 'optimized', label: 'AI Optimized CV' }];

        const renderTabContent = () => {
            switch (activeTab) {
                case 'summary': return <div className="p-6 space-y-4"><h3 className="text-xl font-bold text-slate-800">Analysis Summary</h3><p><strong>Overall ATS Score:</strong> <span className="font-bold text-blue-600">{comparisonResult.final_score}%</span></p><p><strong>Keyword Match:</strong> {comparisonResult.keywords_present.length} found, {comparisonResult.keywords_missing.length} missing.</p><p><strong>Hard Skills Match:</strong> {comparisonResult.hard_skills_found.length} / {comparisonResult.hard_skills_found.length + comparisonResult.hard_skills_missing.length}</p><p><strong>Quantified Achievements:</strong> {comparisonResult.measurable_count} found.</p></div>;
                case 'report': return <div className="p-6"><div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-slate-800">Comprehensive Report</h3><button onClick={handleCopyReport} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"><IconCopy /> {copySuccess || 'Copy Report'}</button></div><textarea readOnly value={comprehensiveReport} className="w-full h-[60vh] p-3 font-mono text-sm border border-slate-300 rounded-md bg-slate-50 text-slate-800" placeholder="Generating report..."></textarea></div>;
                case 'skills': return <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6"><div><h4 className="text-lg font-semibold text-slate-700 mb-2">Hard Skills</h4><p className="text-sm mb-2 text-slate-500">Found: {comparisonResult.hard_skills_found.length}, Missing: {comparisonResult.hard_skills_missing.length}</p><h5 className="font-semibold text-emerald-600">Found:</h5><ul className="list-disc list-inside text-sm text-slate-600 max-h-48 overflow-y-auto bg-slate-50 p-2 rounded">{comparisonResult.hard_skills_found.map(s => <li key={s}>{s}</li>)}</ul><h5 className="font-semibold text-red-600 mt-4">Missing:</h5><ul className="list-disc list-inside text-sm text-slate-600 max-h-48 overflow-y-auto bg-slate-50 p-2 rounded">{comparisonResult.hard_skills_missing.map(s => <li key={s}>{s}</li>)}</ul></div><div><h4 className="text-lg font-semibold text-slate-700 mb-2">Soft Skills</h4><p className="text-sm mb-2 text-slate-500">Found: {comparisonResult.soft_skills_found.length}, Missing: {comparisonResult.soft_skills_missing.length}</p><h5 className="font-semibold text-emerald-600">Found:</h5><ul className="list-disc list-inside text-sm text-slate-600 max-h-48 overflow-y-auto bg-slate-50 p-2 rounded">{comparisonResult.soft_skills_found.map(s => <li key={s}>{s}</li>)}</ul><h5 className="font-semibold text-red-600 mt-4">Missing:</h5><ul className="list-disc list-inside text-sm text-slate-600 max-h-48 overflow-y-auto bg-slate-50 p-2 rounded">{comparisonResult.soft_skills_missing.map(s => <li key={s}>{s}</li>)}</ul></div></div>;
                case 'recommendations': return <div className="p-6"><h3 className="text-xl font-bold text-slate-800 mb-4">Improvement Tips</h3><ul className="space-y-3">{improvementTips.map((tip, index) => (<li key={index} className="flex items-start p-3 bg-blue-50 rounded-lg"><span className="mr-3 text-blue-500">💡</span><span className="text-slate-700">{tip}</span></li>))}</ul></div>;
                case 'optimized': return <div className="p-6"><h3 className="text-xl font-bold text-slate-800 mb-4">AI Optimized CV</h3>{optimizedCv ? <pre className="whitespace-pre-wrap font-sans text-sm bg-slate-50 p-4 rounded-md border border-slate-200 max-h-[60vh] overflow-y-auto">{optimizedCv}</pre> : <p className="text-slate-500">Click "AI Optimize" to generate an enhanced version of your CV.</p>}</div>;
                default: return null;
            }
        };

        return (
            <div className="bg-white rounded-xl shadow-lg">
                <h2 className="text-xl font-bold p-6 border-b border-slate-200">2. Results & Recommendations</h2>
                <div className="border-b border-slate-200"><nav className="-mb-px flex space-x-6 px-6 overflow-x-auto" aria-label="Tabs">{tabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>{tab.label}</button>))}</nav></div>
                <div className="min-h-[200px]">{renderTabContent()}</div>
            </div>
        )
    };

    const renderStandaloneResults = () => {
        if (!standaloneResult) return <p className="text-slate-500 p-6 text-center">Run a health check to see your CV's general analysis here.</p>;
        const { formattingResult: fr, top_skill_domain } = standaloneResult;
        return (
             <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4">CV Health Check Results</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-semibold text-lg mb-2">Content & Structure</h3>
                        <p><strong>Word Count:</strong> {standaloneResult.word_count}</p>
                        <p><strong>Quantified Achievements:</strong> {standaloneResult.measurable_count}</p>
                        <p><strong>Sections Found:</strong> {standaloneResult.sections_found.length} / 6 ({standaloneResult.sections_found.join(', ') || 'None'})</p>
                        {standaloneResult.sections_missing.length > 0 && <p className="text-red-600"><strong>Missing Sections:</strong> {standaloneResult.sections_missing.join(', ')}</p>}
                    </div>
                     <div>
                        <h3 className="font-semibold text-lg mb-2">Formatting Score: <span className="text-blue-600">{fr.overall_format_score}%</span></h3>
                        <p><strong>Contact Info:</strong> {fr.contact_info.email ? '✅' : '❌'} Email, {fr.contact_info.phone ? '✅' : '❌'} Phone</p>
                        <p><strong>Web Presence (LinkedIn/Portfolio):</strong> {fr.web_presence ? '✅ Found' : '❌ Missing'}</p>
                        <p><strong>Long Paragraphs:</strong> {fr.long_paragraphs} (Aim for 0-2)</p>
                     </div>
                </div>
                <div className="mt-6 border-t pt-4">
                    <h3 className="font-semibold text-lg mb-2">Skill Profile</h3>
                    <p><strong>Primary Skill Domain Detected:</strong> <span className="font-bold text-blue-600">{top_skill_domain.replace(/_/g, ' ')}</span></p>
                    <p className="text-sm text-slate-500">Based on this profile, your CV appears most suitable for roles in this field.</p>
                </div>
             </div>
        )
    };
    
    return (
        <div className="bg-slate-100 min-h-screen font-sans text-slate-800">
            {isLoading && <Loader message={loadingMessage} />}
            <header className="bg-white shadow-sm"><div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8"><h1 className="text-2xl font-bold text-slate-900">FEPS Advanced ATS CV Optimizer</h1><p className="text-sm text-slate-500">Intelligent analysis for your professional journey.</p></div></header>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Panel */}
                    <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg flex flex-col items-center">
                        <h2 className="text-xl font-bold mb-4">Analysis Dashboard</h2>
                        {mode === 'comparison' && (comparisonResult ? <ScoreGauge score={comparisonResult.final_score} /> : <div className="flex items-center justify-center w-56 h-56 bg-slate-50 rounded-full"><p className="text-slate-500 text-center">Run analysis to see ATS score</p></div>)}
                        {mode === 'standalone' && (standaloneResult ? <ScoreGauge score={standaloneResult.formattingResult.overall_format_score} /> : <div className="flex items-center justify-center w-56 h-56 bg-slate-50 rounded-full"><p className="text-slate-500 text-center">Run analysis to see health score</p></div>)}
                        
                        <div className="w-full mt-6">
                            {mode === 'comparison' && comparisonResult && formattingResult && (<>
                                <ProgressBar label="Keyword Match" value={Math.round(((comparisonResult.keywords_present.length + comparisonResult.keywords_fuzzy.length * 0.6) / (comparisonResult.keywords_present.length + comparisonResult.keywords_missing.length + comparisonResult.keywords_fuzzy.length)) * 100)} />
                                <ProgressBar label="Hard Skills" value={Math.round((comparisonResult.hard_skills_found.length / (comparisonResult.hard_skills_found.length + comparisonResult.hard_skills_missing.length)) * 100)} />
                                <ProgressBar label="Formatting" value={Math.round(formattingResult.overall_format_score)} />
                            </>)}
                        </div>

                         <div className="w-full mt-4 p-4 bg-slate-50 rounded-lg max-h-48 overflow-y-auto">
                            <h3 className="font-bold text-slate-700 mb-2">Quick Tips</h3>
                            {mode === 'comparison' && improvementTips.length > 0 ? (<ul className="list-disc list-inside text-sm text-slate-600 space-y-1">{improvementTips.slice(0, 4).map((tip, i) => <li key={i}>{tip}</li>)}</ul>) : (<p className="text-sm text-slate-500">Tips will appear here after analysis.</p>)}
                        </div>
                    </div>

                    {/* Right Panel */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-lg">
                            <div className="mb-4"><div className="isolate flex divide-x divide-gray-200 rounded-lg shadow-sm"><button onClick={() => setMode('comparison')} className={`relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 focus:z-10 ${mode === 'comparison' ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 hover:bg-gray-50'}`}>CV vs. Job Description Match</button><button onClick={() => setMode('standalone')} className={`relative -ml-px inline-flex items-center rounded-r-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 focus:z-10 ${mode === 'standalone' ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 hover:bg-gray-50'}`}>Standalone CV Health Check</button></div></div>
                             {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert"><span className="block sm:inline">{error}</span></div>}
                            <div className={`grid grid-cols-1 ${mode === 'comparison' ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-6`}>
                                <div>
                                    <label htmlFor="cv" className="block text-sm font-medium text-slate-700 mb-1">Your CV Content</label>
                                    <textarea id="cv" rows={mode === 'comparison' ? 10 : 20} value={cvText} onChange={(e) => setCvText(e.target.value)} className="w-full p-3 font-mono text-sm border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 placeholder-slate-400" placeholder="Paste your CV content here, or upload a file..."></textarea>
                                    <label htmlFor="file-upload" className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 cursor-pointer"><IconFile /> Upload CV (PDF, DOCX, TXT)</label>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".pdf,.docx,.txt" onChange={handleFileChange} />
                                </div>
                                {mode === 'comparison' && (<div>
                                    <label htmlFor="jd" className="block text-sm font-medium text-slate-700 mb-1">Job Description</label>
                                    <textarea id="jd" rows={10} value={jdText} onChange={(e) => setJdText(e.target.value)} className="w-full p-3 font-mono text-sm border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 placeholder-slate-400" placeholder="Paste the job description here..."></textarea>
                                </div>)}
                            </div>
                             <div className="mt-6 flex flex-col sm:flex-row gap-4">
                                <button onClick={handleAnalyze} disabled={isLoading} className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed"><IconAnalyze /> {mode === 'comparison' ? 'Analyze CV vs. JD' : 'Run CV Health Check'}</button>
                                {mode === 'comparison' && <button onClick={handleOptimize} disabled={isLoading} className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:bg-slate-400 disabled:cursor-not-allowed"><IconOptimize /> AI Optimize</button>}
                            </div>
                        </div>

                        {mode === 'comparison' && renderComparisonResults()}
                        {mode === 'standalone' && renderStandaloneResults()}
                    </div>
                </div>
            </main>
        </div>
    );
}