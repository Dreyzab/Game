import { useEffect, useMemo, useState } from 'react'
import { HexGrid } from './components/HexGrid'
import { generateMap } from '../services/mapGenerator'
import { hexToString } from '../utils/hexMath'
import type { BiomeType, GameState, HexCell, HexCoordinate, ResourceType, ThreatLevel } from '../types'
import { BiomeType as BiomeEnum, ResourceType as ResourceEnum, ThreatLevel as ThreatEnum } from '../types'

const MAP_RADIUS = 8

interface SurvivalMapEditorProps {
    onExit: () => void
}

export const SurvivalMapEditor = ({ onExit }: SurvivalMapEditorProps) => {
    const [map, setMap] = useState<HexCell[]>([])
    const [selectedHex, setSelectedHex] = useState<HexCoordinate | null>(null)
    const [hoveredHex, setHoveredHex] = useState<HexCoordinate | null>(null)


    // Editor Tools
    const [paintBiome, setPaintBiome] = useState<BiomeType>(BiomeEnum.WASTELAND)
    const [paintResource, setPaintResource] = useState<ResourceType>(ResourceEnum.NONE)
    const [paintThreat, setPaintThreat] = useState<ThreatLevel>(ThreatEnum.LOW)
    const [brushMode, setBrushMode] = useState<'paint' | 'select'>('select')

    // Save/Load System
    const [savedMaps, setSavedMaps] = useState<{ id: string; name: string; map: HexCell[] }[]>([])
    const [showSaveDialog, setShowSaveDialog] = useState(false)
    const [showLoadDialog, setShowLoadDialog] = useState(false)
    const [mapNameInput, setMapNameInput] = useState('')

    // Load initial map
    useEffect(() => {
        try {
            const storedMaps = localStorage.getItem('survival_saved_maps')
            if (storedMaps) {
                setSavedMaps(JSON.parse(storedMaps))
            }

            const saved = localStorage.getItem('survival_custom_map')
            if (saved) {
                setMap(JSON.parse(saved))
            } else {
                setMap(generateMap(MAP_RADIUS))
            }
        } catch {
            setMap(generateMap(MAP_RADIUS))
        }
    }, [])

    const handleSaveMap = () => {
        if (!mapNameInput.trim()) return

        const newMap = {
            id: crypto.randomUUID(),
            name: mapNameInput.trim(),
            map: map,
        }

        const updatedMaps = [...savedMaps, newMap]
        setSavedMaps(updatedMaps)
        localStorage.setItem('survival_saved_maps', JSON.stringify(updatedMaps))

        // Also save as current "active" custom map for immediate backward compatibility
        localStorage.setItem('survival_custom_map', JSON.stringify(map))

        setShowSaveDialog(false)
        setMapNameInput('')
        alert(`Карта "${newMap.name}" сохранена!`)
    }

    const handleLoadMap = (id: string) => {
        const target = savedMaps.find((m) => m.id === id)
        if (target) {
            if (confirm(`Загрузить карту "${target.name}"? Текущие несохраненные изменения будут потеряны.`)) {
                setMap(target.map)
                setShowLoadDialog(false)
            }
        }
    }

    const handleDeleteMap = (id: string) => {
        if (confirm('Вы уверены, что хотите удалить эту карту?')) {
            const updated = savedMaps.filter((m) => m.id !== id)
            setSavedMaps(updated)
            localStorage.setItem('survival_saved_maps', JSON.stringify(updated))
        }
    }

    // Auto-save effect (debounced slightly or on change)
    /* 
    useEffect(() => {
       if (map.length > 0) {
           localStorage.setItem('survival_custom_map', JSON.stringify(map))
       }
    }, [map]) 
    */



    // Helper to update a cell
    const updateCell = (q: number, r: number, updates: Partial<HexCell>) => {
        setMap(prev => prev.map(cell => {
            if (cell.q === q && cell.r === r) {
                return { ...cell, ...updates }
            }
            return cell
        }))
    }

    const handleHexClick = (hex: HexCell) => {
        if (brushMode === 'select') {
            if (selectedHex?.q === hex.q && selectedHex?.r === hex.r) {
                setSelectedHex(null)
            } else {
                setSelectedHex(hex)
                // Auto-pick tool values from selected hex
                setPaintBiome(hex.biome)
                setPaintResource(hex.resource)
                setPaintThreat(hex.threatLevel)
            }
        } else {
            // Paint Mode
            updateCell(hex.q, hex.r, {
                biome: paintBiome,
                resource: paintResource,
                threatLevel: paintThreat
            })
        }
    }

    // Create minimal GameState for HexGrid to render
    const editorGameState: GameState = useMemo(() => ({
        map,
        player: {
            position: { q: 999, r: 999 }, // Hide player
            ap: 10,
            maxAp: 10,
            health: 100,
            maxHealth: 100,
            inventory: []
        },
        // Reveal ALL hexes for editor
        revealedHexes: new Set(map.map(h => hexToString(h))),
        turn: 0
    }), [map])

    // Mock visible hexes (all)
    const visibleHexes = useMemo(() => new Set(map.map(h => hexToString(h))), [map])

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col font-mono text-white">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between p-2 border-b border-gray-800 bg-gray-900 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onExit} className="text-gray-400 hover:text-white px-2">
                        ← Назад
                    </button>
                    <h2 className="font-bold text-amber-500">РЕДАКТОР КАРТЫ</h2>
                    <div className="flex gap-2 text-sm">
                        <button
                            onClick={() => setShowSaveDialog(true)}
                            className="bg-blue-700 hover:bg-blue-600 px-3 py-1 rounded transition-colors"
                        >
                            💾 Сохранить
                        </button>
                        <button
                            onClick={() => setShowLoadDialog(true)}
                            className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition-colors"
                        >
                            📂 Загрузить
                        </button>
                        <button
                            onClick={() => {
                                if (confirm('Сбросить карту до случайной генерации?')) {
                                    setMap(generateMap(MAP_RADIUS))
                                }
                            }}
                            className="bg-red-900/50 hover:bg-red-800 px-3 py-1 rounded transition-colors"
                        >
                            🎲 Сброс
                        </button>
                    </div>
                </div>
                <div className="text-xs text-gray-500 pr-4">
                    Hex: {hoveredHex ? `${hoveredHex.q},${hoveredHex.r}` : '--'}
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Editor Toolbar (Left) */}
                <div className="w-64 bg-slate-800/90 border-r border-slate-700 p-4 z-20 flex flex-col overflow-y-auto backdrop-blur-md">

                    <div className="mb-6">
                        <h3 className="font-bold mb-2 text-sm text-slate-400">Инструменты</h3>
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setBrushMode('select')}
                                className={`flex-1 py-2 rounded text-sm transition-colors ${brushMode === 'select' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-gray-300'}`}
                            >Выбор</button>
                            <button
                                onClick={() => setBrushMode('paint')}
                                className={`flex-1 py-2 rounded text-sm transition-colors ${brushMode === 'paint' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-gray-300'}`}
                            >Кисть</button>
                        </div>
                    </div>

                    {/* Properties Panel */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">Биом</label>
                            <select
                                value={paintBiome}
                                onChange={e => setPaintBiome(e.target.value as BiomeType)}
                                className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm outline-none focus:border-amber-500"
                            >
                                {Object.values(BiomeEnum).map(b => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">Ресурс</label>
                            <select
                                value={paintResource}
                                onChange={e => setPaintResource(e.target.value as ResourceType)}
                                className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm outline-none focus:border-amber-500"
                            >
                                {Object.values(ResourceEnum).map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">Угроза</label>
                            <select
                                value={paintThreat}
                                onChange={e => setPaintThreat(e.target.value as ThreatLevel)}
                                className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm outline-none focus:border-amber-500"
                            >
                                {Object.values(ThreatEnum).map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>

                        {selectedHex && brushMode === 'select' && (
                            <div className="bg-slate-900 p-3 rounded text-xs mt-4 border border-slate-600">
                                <p className="font-bold text-amber-500 mb-1">Выбранный гекс</p>
                                <p className="text-gray-400 mb-2">Q: {selectedHex.q}, R: {selectedHex.r}</p>
                                {/* Button to apply current paint settings to selected */}
                                <button
                                    onClick={() => updateCell(selectedHex.q, selectedHex.r, {
                                        biome: paintBiome,
                                        resource: paintResource,
                                        threatLevel: paintThreat
                                    })}
                                    className="w-full mt-2 bg-slate-700 hover:bg-slate-600 py-1 rounded transition-colors"
                                >
                                    Применить текущие
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main View */}
                <div className="flex-1 h-full relative bg-black">
                    {map.length > 0 && (
                        <HexGrid
                            gameState={editorGameState}
                            selectedHex={selectedHex}
                            hoveredHex={hoveredHex}
                            visibleHexes={visibleHexes}
                            setHoveredHex={setHoveredHex}
                            onHexClick={handleHexClick}
                        />
                    )}

                    <div className="absolute top-4 right-4 pointer-events-none text-right">
                        <div className="bg-black/50 p-2 rounded text-xs text-white border border-white/10">
                            {brushMode === 'paint' ? '🖌️ РЕЖИМ РИСОВАНИЯ' : '👆 РЕЖИМ ВЫБОРА'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            {showSaveDialog && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
                    <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl w-80 shadow-2xl shadow-blue-900/20">
                        <h3 className="text-xl font-bold mb-4 text-blue-400">Сохранить Карту</h3>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Название карты"
                            value={mapNameInput}
                            onChange={(e) => setMapNameInput(e.target.value)}
                            className="w-full bg-black border border-gray-600 p-2 rounded mb-4 text-white outline-none focus:border-blue-500"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowSaveDialog(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleSaveMap}
                                disabled={!mapNameInput.trim()}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded disabled:opacity-50 text-white font-bold"
                            >
                                Сохранить
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showLoadDialog && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
                    <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl w-96 max-h-[80vh] flex flex-col shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 text-emerald-400">Загрузить Карту</h3>
                        <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1">
                            {savedMaps.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">Нет сохраненных карт</p>
                            ) : (
                                savedMaps.map((m) => (
                                    <div key={m.id} className="flex items-center justify-between bg-black/50 p-3 rounded border border-gray-800 hover:border-gray-600 transition-colors">
                                        <span className="font-bold truncate max-w-[180px] text-gray-200">{m.name}</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleLoadMap(m.id)}
                                                className="text-xs bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 px-3 py-1.5 rounded transition-colors"
                                            >
                                                Load
                                            </button>
                                            <button
                                                onClick={() => handleDeleteMap(m.id)}
                                                className="text-xs bg-red-900/40 hover:bg-red-900/60 text-red-300 px-3 py-1.5 rounded transition-colors"
                                            >
                                                Del
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowLoadDialog(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white"
                            >
                                Закрыть
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
