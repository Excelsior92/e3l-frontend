export async function saveTasksAndResourcesToBackend({ tasks, resources, userId, persona, skill }) {
 function groupByHeading(lines) {
  const grouped = [];
  let currentGroup = [];

  lines.forEach((line) => {
    if (line.match(/^\d+\.\s\*\*/)) {
      if (currentGroup.length) {
        grouped.push(currentGroup.join('\n'));
        currentGroup = [];
      }
    }
    currentGroup.push(line);
  });

  if (currentGroup.length) {
    grouped.push(currentGroup.join('\n'));
  }

  return grouped;
}

const groupedTasks = groupByHeading(tasks);
const groupedResources = groupByHeading(resources);

const items = [
  ...groupedTasks.map((t) => ({ type: 'task', content: t })),
  ...groupedResources.map((r) => ({ type: 'resource', content: r })),
];


  // 🧪 Debug what data you're about to send
  console.log('[🧪 saveTasksAndResourcesToBackend] Called with:', {
    userId,
    persona,
    skill,
    totalItems: items.length,
    sampleItem: items[0]
  });

  try {
    const response = await fetch('http://localhost:5001/api/learning-items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        persona,
        skill,
        items
      })
    });

    const result = await response.json();

    // ✅ Success log
    console.log('[✅ LearningItems Saved]:', result.message);
  } catch (err) {
    // ❌ Error log
    console.error('[❌ Save Failed]:', err);
  }
}
