/**
 * Auto-generates a teacher comment based on:
 * - Current average percentage
 * - Class position
 * - Improvement vs previous term
 */

export function generateResultComment(params: {
  avgPercentage: number;
  position: number | null;
  totalStudents: number;
  previousAvgPercentage: number | null;
}): string {
  const { avgPercentage, position, totalStudents, previousAvgPercentage } = params;

  // --- Performance level ---
  let levelPhrase: string;
  if (avgPercentage >= 90) {
    levelPhrase = 'An outstanding performance';
  } else if (avgPercentage >= 80) {
    levelPhrase = 'A very commendable performance';
  } else if (avgPercentage >= 70) {
    levelPhrase = 'A good performance';
  } else if (avgPercentage >= 60) {
    levelPhrase = 'A fair performance';
  } else if (avgPercentage >= 50) {
    levelPhrase = 'A below average performance';
  } else if (avgPercentage >= 40) {
    levelPhrase = 'A poor performance';
  } else {
    levelPhrase = 'A very poor result';
  }

  // --- Position phrase ---
  let positionPhrase = '';
  if (position !== null && totalStudents > 0) {
    const suffix = position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th';
    if (position === 1) {
      positionPhrase = `, emerging 1st out of ${totalStudents} students`;
    } else if (position <= 3) {
      positionPhrase = `, placing ${position}${suffix} in a class of ${totalStudents}`;
    } else if (position <= Math.ceil(totalStudents * 0.3)) {
      positionPhrase = `, ranking ${position}${suffix} in class`;
    } else {
      positionPhrase = `, ranking ${position}${suffix} out of ${totalStudents} students`;
    }
  }

  // --- Improvement phrase ---
  let improvementPhrase = '';
  if (previousAvgPercentage !== null) {
    const diff = avgPercentage - previousAvgPercentage;
    if (diff >= 10) {
      improvementPhrase = ' This is a remarkable improvement from last term.';
    } else if (diff >= 5) {
      improvementPhrase = ' Shows clear improvement from last term.';
    } else if (diff >= 1) {
      improvementPhrase = ' A slight improvement from last term.';
    } else if (diff === 0) {
      improvementPhrase = ' Performance is consistent with last term.';
    } else if (diff >= -5) {
      improvementPhrase = ' Performance has slightly declined from last term.';
    } else if (diff >= -10) {
      improvementPhrase = ' Performance has dropped from last term.';
    } else {
      improvementPhrase = ' A significant drop from last term requires urgent attention.';
    }
  }

  // --- Recommendation ---
  let recommendation: string;
  if (avgPercentage >= 90) {
    recommendation = ' Keep up the excellent work and continue to lead!';
  } else if (avgPercentage >= 80) {
    recommendation = ' Aim for the very top next term!';
  } else if (avgPercentage >= 70) {
    recommendation = ' More dedication will take you to the top.';
  } else if (avgPercentage >= 60) {
    recommendation = ' Put in more effort and you will achieve better results.';
  } else if (avgPercentage >= 50) {
    recommendation = ' Serious attention to studies is highly recommended.';
  } else {
    recommendation = ' You must work much harder. Seek help from your teachers.';
  }

  return `${levelPhrase}${positionPhrase}.${improvementPhrase}${recommendation}`;
}
