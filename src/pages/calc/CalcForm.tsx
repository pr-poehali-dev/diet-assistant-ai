import Icon from "@/components/ui/icon";
import { CalcInput } from "./calcTypes";

// ─── RadioGroup ───────────────────────────────────────────────────────────────
function RadioGroup({ label, options, value, onChange }: {
  label: string;
  options: { v: string; label: string; sub?: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <div className="flex flex-col gap-1.5">
        {options.map((o) => (
          <label key={o.v} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer border transition-all duration-150 ${value === o.v ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-gray-300 bg-white"}`}>
            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${value === o.v ? "border-emerald-500" : "border-gray-300"}`}>
              {value === o.v && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
            </div>
            <input type="radio" className="hidden" value={o.v} checked={value === o.v} onChange={() => onChange(o.v)} />
            <span className="text-sm font-medium text-gray-700">{o.label}</span>
            {o.sub && <span className="text-xs text-gray-400 ml-auto">{o.sub}</span>}
          </label>
        ))}
      </div>
    </div>
  );
}

// ─── NumInput ─────────────────────────────────────────────────────────────────
function NumInput({ label, value, onChange, placeholder, unit }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; unit: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-9 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{unit}</span>
      </div>
    </div>
  );
}

// ─── CalcForm ─────────────────────────────────────────────────────────────────
interface CalcFormProps {
  inp: CalcInput;
  setInp: React.Dispatch<React.SetStateAction<CalcInput>>;
  calcError: string;
  onCalc: () => void;
}

export default function CalcForm({ inp, setInp, calcError, onCalc }: CalcFormProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
        <Icon name="Calculator" size={16} className="text-emerald-500" />
        Калькулятор
      </h2>

      {/* Gender */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Пол</p>
        <div className="grid grid-cols-2 gap-2">
          {[{ v: "female", label: "Женщина" }, { v: "male", label: "Мужчина" }].map((o) => (
            <button key={o.v} onClick={() => setInp((p) => ({ ...p, gender: o.v }))}
              className={`py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150 ${inp.gender === o.v ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Age / Weight / Height */}
      <div className="grid grid-cols-3 gap-3">
        <NumInput label="Возраст" value={inp.age} onChange={(v) => setInp((p) => ({ ...p, age: v }))} placeholder="30" unit="лет" />
        <NumInput label="Вес" value={inp.weight} onChange={(v) => setInp((p) => ({ ...p, weight: v }))} placeholder="70" unit="кг" />
        <NumInput label="Рост" value={inp.height} onChange={(v) => setInp((p) => ({ ...p, height: v }))} placeholder="170" unit="см" />
      </div>

      {/* Activity */}
      <RadioGroup
        label="Активность"
        value={inp.activity}
        onChange={(v) => setInp((p) => ({ ...p, activity: v }))}
        options={[
          { v: "sedentary", label: "Сидячий образ жизни", sub: "×1.2" },
          { v: "light", label: "1–3 тренировки в неделю", sub: "×1.375" },
          { v: "moderate", label: "3–5 тренировок в неделю", sub: "×1.55" },
          { v: "active", label: "Ежедневные тренировки", sub: "×1.725" },
          { v: "veryactive", label: "Интенсивный спорт/работа", sub: "×1.9" },
        ]}
      />

      {/* Goal */}
      <RadioGroup
        label="Цель"
        value={inp.goal}
        onChange={(v) => setInp((p) => ({ ...p, goal: v }))}
        options={[
          { v: "loss", label: "Похудение", sub: "−500 ккал" },
          { v: "softloss", label: "Мягкое похудение", sub: "−250 ккал" },
          { v: "maintain", label: "Поддержание веса", sub: "±0 ккал" },
          { v: "gain", label: "Набор мышечной массы", sub: "+250 ккал" },
          { v: "fastgain", label: "Быстрый набор", sub: "+500 ккал" },
        ]}
      />

      {calcError && (
        <p className="text-red-500 text-xs flex items-center gap-1">
          <Icon name="AlertCircle" size={13} /> {calcError}
        </p>
      )}

      <button
        onClick={onCalc}
        className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-bold text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-sm"
      >
        <Icon name="Zap" size={16} className="text-white" />
        Рассчитать
      </button>
    </div>
  );
}
