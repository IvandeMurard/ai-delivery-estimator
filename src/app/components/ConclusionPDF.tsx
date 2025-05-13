import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff'
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    color: '#1e40af',
    textAlign: 'center'
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 10,
    color: '#1e40af'
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
    color: '#1f2937'
  },
  advanced: {
    fontSize: 12,
    marginTop: 20,
    color: '#92400e',
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 6
  },
  table: {
    width: 'auto',
    marginBottom: 10,
    marginTop: 10
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeader: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#1e40af',
    padding: 4,
    borderBottom: '1px solid #1e40af',
    flex: 1
  },
  tableCell: {
    fontSize: 12,
    color: '#1f2937',
    padding: 4,
    flex: 1
  },
  total: {
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: 13,
    color: '#be185d',
    marginTop: 6
  }
})

interface ConclusionPDFProps {
  conclusionText: string
  advancedSection?: string | null
}

function extractTasksAndTotal(text: string) {
  // Extraction des tâches techniques et estimations depuis le texte
  const taskLines = (text.match(/(\d+\.|-)\s.*?(?::|\()\s*\d+\s*jours?\)|\d+\.\s.*?:\s*\d+\s*jours?/g) || []);
  const tasks = taskLines.map(l => {
    const match = l.match(/^(?:\d+\.|-)\s*(.*?)\s*(?::|\()\s*(\d+\s*jours?)\)?/);
    return {
      name: match ? match[1].trim() : l,
      days: match ? match[2] : '—'
    }
  })
  // Extraction du total
  const totalMatch = text.match(/total de (\d+) jours?/i) || text.match(/environ (\d+) jours?/i)
  const total = totalMatch ? totalMatch[1] : null
  return { tasks, total }
}

export const ConclusionPDF = ({ conclusionText, advancedSection }: ConclusionPDFProps) => {
  const { tasks, total } = extractTasksAndTotal(conclusionText)
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Conclusion de l'estimation</Text>
        {/* Tableau des tâches techniques */}
        {tasks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tâches techniques</Text>
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <Text style={styles.tableHeader}>Tâches</Text>
                <Text style={styles.tableHeader}>Estimation</Text>
              </View>
              {tasks.map((task, idx) => (
                <View style={styles.tableRow} key={idx}>
                  <Text style={styles.tableCell}>{task.name}</Text>
                  <Text style={styles.tableCell}>{task.days}</Text>
                </View>
              ))}
            </View>
            {total && (
              <Text style={styles.total}>Total estimé : {total} jours</Text>
            )}
          </View>
        )}
        {/* Résumé/Conclusion */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Résumé</Text>
          <Text style={styles.text}>{conclusionText}</Text>
        </View>
        {advancedSection && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Calculs secondaires</Text>
            <Text style={styles.advanced}>{advancedSection}</Text>
          </View>
        )}
      </Page>
    </Document>
  )
} 