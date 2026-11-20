"""Règles d'estimation validées par l'utilisateur, séparées des déclarations."""
import re

MINIMUM_CLASSES=2
MINIMUM_TEACHERS=2
PUPILS_PER_CLASS=22
TRAINING_HOURS_PER_TEACHER=6
SUPPORT_HOURS_PER_TEACHER=9

def retained_count(value, minimum=2):
    raw=str(value or '').strip()
    declared=int(raw) if re.fullmatch(r'\d+',raw) else None
    return {'declared':declared,'retained':max(minimum,declared or 0),
            'basis':'declared' if declared is not None and declared>=minimum else 'minimum_assumed'}

def estimate(classes,teachers):
    c=retained_count(classes,MINIMUM_CLASSES)
    t=retained_count(teachers,MINIMUM_TEACHERS)
    return {'classes':c,'teachingTeam':t,
            'estimatedPupils':c['retained']*PUPILS_PER_CLASS,
            'plannedTrainingParticipantHours':t['retained']*TRAINING_HOURS_PER_TEACHER,
            'plannedSupportParticipantHours':t['retained']*SUPPORT_HOURS_PER_TEACHER}
