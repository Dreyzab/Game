interface Props {
    value: number
    max: number
    label: string
    color: string
}

const GaugeUI = ({ value, max, label, color }: Props) => {
    const percent = (value / max) * 100
    const rotation = -90 + percent * 1.8

    return (
        <div className="flex flex-col items-center w-14">
            <div className="relative w-12 h-8 bg-zinc-950 rounded-t-full border border-zinc-800 overflow-hidden shadow-inner">
                <div className="absolute inset-0 opacity-20 border-b border-zinc-800" />
                <div
                    className="absolute bottom-0 left-1/2 w-0.5 h-6 origin-bottom transition-transform duration-700"
                    style={{ transform: `translateX(-50%) rotate(${rotation}deg)`, backgroundColor: color }}
                />
                <div className="absolute bottom-[-2px] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-zinc-600" />
            </div>
            <div className="text-[9px] font-bold text-zinc-500 mt-1 uppercase leading-none">
                {label} <span className="text-zinc-300">{Math.floor(value)}</span>
            </div>
        </div>
    )
}

export default GaugeUI

