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
  }
})

interface ConclusionPDFProps {
  conclusionText: string
  advancedSection?: string | null
}

export const ConclusionPDF = ({ conclusionText, advancedSection }: ConclusionPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Conclusion de l'estimation</Text>
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