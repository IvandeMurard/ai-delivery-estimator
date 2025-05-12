import { NextRequest, NextResponse } from 'next/server';

const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_BASE_URL = process.env.JIRA_BASE_URL; // ex: https://votreinstance.atlassian.net
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY || 'AI'; // clé projet par défaut

export async function POST(req: NextRequest) {
  try {
    if (!JIRA_EMAIL || !JIRA_API_TOKEN) {
      return NextResponse.json({ error: 'JIRA non configuré.' }, { status: 500 });
    }
    const { tasks, jiraBaseUrl, jiraProjectKey } = await req.json();
    const baseUrl = jiraBaseUrl || JIRA_BASE_URL;
    const projectKey = jiraProjectKey || JIRA_PROJECT_KEY;
    if (!Array.isArray(tasks) || tasks.length === 0 || !baseUrl || !projectKey) {
      return NextResponse.json({ error: 'Aucune tâche ou configuration JIRA.' }, { status: 400 });
    }
    const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
    const createdTickets: { key: string, url: string }[] = [];
    for (const task of tasks) {
      const summary = task.name || task.titre || task.title || 'Tâche';
      const description = `Durée estimée : ${task.duration || task.estimation || '—'}\nDate de livraison : ${task.deliveryDate || ''}`;
      const res = await fetch(`${baseUrl}/rest/api/3/issue`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            project: { key: projectKey },
            summary,
            description,
            issuetype: { name: 'Task' },
          }
        })
      });
      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: `Erreur JIRA: ${err}` }, { status: 500 });
      }
      const data = await res.json();
      createdTickets.push({ key: data.key, url: `${baseUrl}/browse/${data.key}` });
    }
    return NextResponse.json({ success: true, tickets: createdTickets });
  } catch (e) {
    return NextResponse.json({ error: 'Échec de l\'export JIRA.' }, { status: 500 });
  }
} 