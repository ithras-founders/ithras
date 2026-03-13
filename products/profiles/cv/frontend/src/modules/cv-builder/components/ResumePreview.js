import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const ResumePreview = ({ data }) => {
  return html`
    <div className="bg-white w-full aspect-[1/1.414] shadow-2xl origin-top transition-transform p-[0.4in] font-serif text-[10.5pt] leading-[1.2] text-black border border-slate-300" id="resume-a4">
      <div className="flex justify-between items-start border-b-[1.5pt] border-black pb-2 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 flex items-center justify-center border border-black p-1 bg-white">
            <img src="./assets/logos/iimc.svg" className="max-h-full max-w-full" alt="IIMC Logo" />
          </div>
          <div className="text-[8pt] font-bold">
            <p>भारतीय प्रबंध संस्थान कलकत्ता</p>
            <p>Indian Institute of Management Calcutta</p>
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-[14pt] font-black tracking-tight leading-none">${data.name}</h1>
          <p className="text-[10pt] font-bold mt-1">${data.roll}</p>
        </div>
      </div>

      <div className="bg-[#1e293b] text-white flex justify-between px-2 py-1 text-[8pt] font-bold mb-3">
        ${data.highlights.map((h, i) => html`
          <span key=${i}>${h}</span>
        `)}
      </div>

      <div className="space-y-3">
        <section>
          <div className="bg-[#f1f5f9] border border-black font-bold px-2 py-0.5 text-[8pt] uppercase tracking-wider mb-1">Academic Qualifications</div>
          <table className="w-full border-collapse border border-black text-center text-[8pt]">
            <thead>
              <tr className="bg-white font-bold border-b border-black">
                <th className="border-r border-black p-1">Degree/Exam</th>
                <th className="border-r border-black p-1">Board/Institute</th>
                <th className="border-r border-black p-1">%/CGPA</th>
                <th className="border-r border-black p-1">Rank</th>
                <th className="p-1">Year</th>
              </tr>
            </thead>
            <tbody>
              ${data.academics.map((ac, i) => html`
                <tr key=${i} className="border-b border-black last:border-b-0">
                  <td className="border-r border-black p-1 font-bold">${ac.degree}</td>
                  <td className="border-r border-black p-1">${ac.board}</td>
                  <td className="border-r border-black p-1">${ac.cgpa}</td>
                  <td className="border-r border-black p-1">${ac.rank}</td>
                  <td className="p-1">${ac.year}</td>
                </tr>
              `)}
            </tbody>
          </table>
        </section>

        ${data.sections.map((section, sIdx) => html`
          <section key=${sIdx}>
            <div className="bg-[#f1f5f9] border border-black font-bold px-2 py-0.5 text-[8pt] uppercase tracking-wider mb-1">${section.title}</div>
            <div className="border border-black">
              ${section.items.map((item, iIdx) => html`
                <div key=${iIdx} className=${`flex border-b border-black last:border-b-0 ${iIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                  <div className="w-[1.2in] border-r border-black p-2 flex flex-col justify-center text-center">
                    <p className="font-bold text-[8.5pt]">${item.company}</p>
                    <p className="text-[7.5pt] font-bold mt-1 italic">${item.role}</p>
                    <p className="text-[7pt] mt-1">${item.period}</p>
                  </div>
                  <div className="flex-1 p-2 overflow-hidden">
                    <ul className="list-disc ml-4 space-y-0.5">
                      ${item.bullets.map((bullet, bIdx) => html`
                        <li key=${bIdx} className="text-[9pt] leading-tight overflow-hidden whitespace-nowrap text-ellipsis" title=${bullet}>
                           ${bullet}
                        </li>
                      `)}
                    </ul>
                  </div>
                </div>
              `)}
            </div>
          </section>
        `)}
      </div>

      <div className="absolute bottom-4 left-0 w-full text-center text-[7pt] text-slate-400">
        Email: ${data.email} | Indian Institute of Management Calcutta
      </div>
    </div>
  `;
};

export default ResumePreview;