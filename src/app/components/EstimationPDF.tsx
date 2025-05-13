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
  task: {
    marginLeft: 20,
    marginBottom: 5
  },
  date: {
    fontSize: 14,
    color: '#059669',
    marginBottom: 10
  }
})

interface EstimationPDFProps {
  feature: string
  tasks: string[]
  result: string
  startDate: string
}

export const EstimationPDF = ({ feature, tasks, result, startDate }: EstimationPDFProps) => {
  const deliveryDate = result.match(/Livraison estimée\s*:\s*(\d{2}\/\d{2}\/\d{4})/i)?.[1]
  const totalDays = result.match(/total de (\d+) jours?/i)?.[1]

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Estimation de livraison</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fonctionnalité</Text>
          <Text style={styles.text}>{feature}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tâches techniques</Text>
          {tasks.map((task, index) => (
            <Text key={index} style={[styles.text, styles.task]}>
              {index + 1}. {task}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dates</Text>
          <Text style={styles.date}>Date de démarrage : {startDate}</Text>
          {deliveryDate && (
            <Text style={styles.date}>Date de livraison estimée : {deliveryDate}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Résumé</Text>
          <Text style={styles.text}>
            {result.split('\n').map((line, i) => (
              <Text key={i}>{line}{'\n'}</Text>
            ))}
          </Text>
        </View>

        {totalDays && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Total</Text>
            <Text style={styles.text}>Durée totale estimée : {totalDays} jours</Text>
          </View>
        )}
      </Page>
    </Document>
  )
} 