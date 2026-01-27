import type { EvidenceItem } from '@/features/detective/dossier'

const EVIDENCE_CATALOG: Record<string, Omit<EvidenceItem, 'timestamp'>> = {
  lime_footprints: {
    id: 'lime_footprints',
    label: 'Следы извести на подошвах',
    description:
      'Белая пыль (строительная известь) на досках и у подоконника. Кто-то прошёл со стройки внутрь — уже после закрытия.',
    icon: '👣',
    source: 'Münsterplatz, строительная zona',
  },
  empty_schnapps_bottle: {
    id: 'empty_schnapps_bottle',
    label: 'Пустая бутылка шнапса',
    description:
      'У поста охраны. Сторож явно пил во время смены: реакция притуплена, а собака могла реагировать на запах спирта.',
    icon: '🍾',
    source: 'Münsterplatz, сторожевая будка',
  },
  director_letter: {
    id: 'director_letter',
    label: 'Письмо о слиянии с Creditbank',
    description:
      'Директор готовит перевод активов. Сегодня в хранilище держали наличность и документы — слишком соблазнительная цель.',
    icon: '✉️',
    source: 'Офис директора банка',
  },
  meckel_blueprint: {
    id: 'meckel_blueprint',
    label: 'Чертёж Меккеля: "тонкая стена"',
    description:
      'На плане отмечен участок подвала, граничащий со старым стоком. Идеальный путь для тихого проникновения и отхода.',
    icon: '📐',
    source: 'Прораб, вагончик на стройке',
  },
  friedeberg_poster: {
    id: 'friedeberg_poster',
    label: 'Афиша митинга (Фридеберг)',
    description:
      'Вечером ожидается собрание рабочих. Если кто-то хотел отвлечь полицию — это удобный шумовой фон и причина для перераспределения патрулей.',
    icon: '📰',
    source: 'Ganter Brauerei',
  },
}

export function getDetectiveEvidenceById(id: string): Omit<EvidenceItem, 'timestamp'> | null {
  const safeId = typeof id === 'string' ? id.trim() : ''
  if (!safeId) return null
  return EVIDENCE_CATALOG[safeId] ?? null
}

export function createFallbackEvidence(id: string): Omit<EvidenceItem, 'timestamp'> {
  const safeId = typeof id === 'string' ? id.trim() : 'unknown'
  return {
    id: safeId,
    label: `Улика: ${safeId}`,
    description: 'Улика добавлена в досье.',
    icon: '📎',
    source: 'Unknown',
  }
}
