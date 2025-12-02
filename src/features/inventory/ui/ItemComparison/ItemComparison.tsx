import React from 'react'
import type { ItemState } from '@/entities/item/model/types'
import { ITEM_TEMPLATES } from '@/entities/item/model/templates'
import { clsx } from 'clsx'

type ItemComparisonProps = {
    item: ItemState
    equippedItem?: ItemState | null
    onClose: () => void
}

export const ItemComparison: React.FC<ItemComparisonProps> = ({ item, equippedItem, onClose }) => {
    const template = ITEM_TEMPLATES[item.templateId]
    const equippedTemplate = equippedItem ? ITEM_TEMPLATES[equippedItem.templateId] : null

    if (!template) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="flex gap-4 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
                {/* Equipped Item (if any) */}
                {equippedItem && equippedTemplate && (
                    <div className="flex-1 rounded-lg border border-slate-700 bg-slate-900/95 p-4 shadow-xl">
                        <div className="mb-2 text-xs uppercase tracking-widest text-slate-400">Equipped</div>
                        <div className="mb-4 flex items-center gap-3">
                            <div className="text-4xl">{equippedTemplate.icon}</div>
                            <div>
                                <div className="font-bold text-slate-200">{equippedItem.name}</div>
                                <div className="text-xs text-amber-500">{equippedItem.rarity}</div>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm text-slate-300">
                            {/* Stats comparison would go here */}
                            <div className="flex justify-between">
                                <span>Weight</span>
                                <span>{equippedTemplate.baseStats.weight}kg</span>
                            </div>
                            {equippedTemplate.baseStats.damage && (
                                <div className="flex justify-between">
                                    <span>Damage</span>
                                    <span>{equippedTemplate.baseStats.damage}</span>
                                </div>
                            )}
                            {equippedTemplate.baseStats.defense && (
                                <div className="flex justify-between">
                                    <span>Defense</span>
                                    <span>{equippedTemplate.baseStats.defense}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Selected Item */}
                <div className={clsx("flex-1 rounded-lg border bg-slate-900/95 p-4 shadow-xl",
                    item.rarity === 'legendary' ? "border-amber-500" : "border-blue-500"
                )}>
                    <div className="mb-2 text-xs uppercase tracking-widest text-blue-400">Comparing</div>
                    <div className="mb-4 flex items-center gap-3">
                        <div className="text-4xl">{template.icon}</div>
                        <div>
                            <div className="font-bold text-white">{item.name}</div>
                            <div className="text-xs text-amber-500">{item.rarity}</div>
                        </div>
                    </div>
                    <div className="space-y-2 text-sm text-slate-300">
                        <div className="flex justify-between">
                            <span>Weight</span>
                            <span className={clsx(
                                equippedTemplate && template.baseStats.weight < equippedTemplate.baseStats.weight && "text-green-400",
                                equippedTemplate && template.baseStats.weight > equippedTemplate.baseStats.weight && "text-red-400"
                            )}>{template.baseStats.weight}kg</span>
                        </div>
                        {template.baseStats.damage && (
                            <div className="flex justify-between">
                                <span>Damage</span>
                                <span className={clsx(
                                    equippedTemplate?.baseStats.damage && template.baseStats.damage > equippedTemplate.baseStats.damage && "text-green-400",
                                    equippedTemplate?.baseStats.damage && template.baseStats.damage < equippedTemplate.baseStats.damage && "text-red-400"
                                )}>{template.baseStats.damage}</span>
                            </div>
                        )}
                        {template.baseStats.defense && (
                            <div className="flex justify-between">
                                <span>Defense</span>
                                <span className={clsx(
                                    equippedTemplate?.baseStats.defense && template.baseStats.defense > equippedTemplate.baseStats.defense && "text-green-400",
                                    equippedTemplate?.baseStats.defense && template.baseStats.defense < equippedTemplate.baseStats.defense && "text-red-400"
                                )}>{template.baseStats.defense}</span>
                            </div>
                        )}
                    </div>
                    <div className="mt-4 text-xs text-slate-400 italic">
                        {item.description}
                    </div>
                </div>
            </div>
        </div>
    )
}
