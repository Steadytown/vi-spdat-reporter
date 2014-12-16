var baby = require("babyparse");
var request = require("request");

var clientPrototype = {};

clientPrototype.individual = function() {
  return this.data.type === 'I';
}
clientPrototype.family = function() {
  return this.data.type === 'F';
}
clientPrototype.singleParentFamily = function() {
  return this.data.hohFirstName && !this.data.hoh2FirstName;
}
clientPrototype.twoParentFamily = function() {
  return this.data.hohFirstName && this.data.hoh2FirstName;
}
clientPrototype.hohPregnant = function() {
  return this.data.fCSizeOfFamilyFemaleHohPregnant;
}
clientPrototype.childCount = function() {
  return this.data.fSizeOfFamilyChildrenCurrentlyWith +
    this.data.fSizeOfFamilyChildrenExpectedToJoin;
}
clientPrototype.anyChildOfOrYounger = function(age) {
  return this.data.fCSizeOfFamilyYoungestChildAge <= age;
}

clientPrototype.init = function(data) {
  this.data = data;
  this.scoring = {};
  this.issuesPresent = {};
  this.issuesPresent.wellness = {};
  this.issuesPresent.wellness.physicalHealth = false;
  this.issuesPresent.wellness.mentalHealth = false;
  this.issuesPresent.wellness.medication = false;
  this.issuesPresent.wellness.substanceUse = false;
  this.issuesPresent.wellness.abuseOrTrauma = false;

  this.issuesPresent.risks = {};
  this.issuesPresent.risks.interactionsWithEmergencyServices = false;
  this.issuesPresent.risks.involvementInHighRiskSituations = false;
  this.issuesPresent.risks.managingTenancy = true;
  this.issuesPresent.risks.harm = false;
  this.issuesPresent.risks.legalIssues = false;

  this.issuesPresent.socialization = {};
  this.issuesPresent.socialization.selfCare = false;
  this.issuesPresent.socialization.relationships = false;
  this.issuesPresent.socialization.meaningfulActivities = false;
  this.issuesPresent.socialization.moneyManagement = false;

  this.issuesPresent.historyOfHousingAndHomelessness = {};
  this.issuesPresent.historyOfHousingAndHomelessness.historyOfHousingAndHomelessness = false;

  this.issuesPresent.familyUnit = {};
  if (this.family()) {
    this.issuesPresent.familyUnit.parentalEngagement = false;
    this.issuesPresent.familyUnit.stability = false;
    this.issuesPresent.familyUnit.needsOfChildren = false;
    this.issuesPresent.familyUnit.sizeOfFamily = false;
    this.issuesPresent.familyUnit.interactionsWithDCF = false;
  }
}

clientPrototype.scoreYes = function(x, domain, component, dimension, forEach) {
  if (!forEach) {
    if (dimension) {
        if (this.issuesPresent[domain][dimension]) {
          return;
        }
    } else {
      if (this.issuesPresent[domain][component]) {
        return;
      }
    }
  }
  if (x && x !== "refused") {
    x = parseInt(x);
    if (x === 1) {
      this.scoring[domain]++;
      this.issuesPresent[domain][component] = true;
      if (dimension) {
        console.log(this.data.id, "Yes, Scoring", domain, component, dimension);
        this.issuesPresent[domain][dimension] = true;
      } else {
        console.log(this.data.id, "Yes, Scoring ", domain, component);
      }
    }
  }
}

clientPrototype.scoreNo = function(x, domain, component) {
  if (this.issuesPresent[domain][component]) {
    return;
  }
  if (x && x !== "refused") {
    x = parseInt(x);
    if (x === 0) {
      console.log(this.data.id, "No, Scoring ", domain, component);
      this.scoring[domain]++;
      this.issuesPresent[domain][component] = true;
    }
  }
}

clientPrototype.scoreTotalGte = function(value, x, domain, component) {
  if (this.issuesPresent[domain][component]) {
    return;
  }
  if (typeof value === 'string' ) {
    value = [ value ];
  }
  var total = 0;
  for (var i = 0; i < value.length; i++) {
    var e = value[i];
    if (e && e !== "refused") {
      total += parseInt(e);
    }
  }
  if (total >= x) {
    console.log(this.data.id, ">= " + x + ", Scoring ", domain, component);
    this.scoring[domain]++;
    this.issuesPresent[domain][component] = true;
  }
}

clientPrototype.scoreValueEq = function(value, x, domain, component) {
  if (this.issuesPresent[domain][component]) {
    return;
  }
  if (x && x !== "refused") {
    if (x === value) {
      console.log(this.data.id, "== " + x + ", Scoring ", domain, component);
      this.scoring[domain]++;
      this.issuesPresent[domain][component] = true;
    }
  }
}

clientPrototype.scoreValueOtherThan = function(value, x, domain, component) {
  if (this.issuesPresent[domain][component]) {
    return;
  }
  if (x && x !== "refused") {
    if (x !== value) {
      console.log(this.data.id, "!= " + x + ", Scoring ", domain, component);
      this.scoring[domain]++;
      this.issuesPresent[domain][component] = true;
    }
  }
}

clientPrototype.scoreGeneralInformation = function() {
  this.scoring.generalInformation = 0;

  if (this.individual()) {
    if (this.data.hoh1Age >= 60) {
      console.log(this.data.id, "Scoring >= 60", "generalInformation")
      this.scoring.generalInformation++;
    }
  } else if (this.family()) {
    if (this.data.hoh1Age >= 60 || this.data.hoh2Age >= 60) {
      console.log(this.data.id, "Scoring >= 60", "generalInformation")
      this.scoring.generalInformation++;
    }
    if (this.singleParentFamily()) {
      if (this.childCount() >= 2 || this.anyChildOfOrYounger(11) || this.hohPregnant()) {
        console.log(this.data.id, "Scoring >= 2 children || <= 11 age || pregnant", "familyUnit", "sizeOfFamily");
        this.scoring.generalInformation++;
        this.issuesPresent.familyUnit.sizeOfFamily = true;
      }
    } else if (this.twoParentFamily()) {
      if (this.childCount() >= 3 || this.anyChildOfOrYounger(6) || this.hohPregnant()) {
        console.log(this.data.id, "Scoring >= 3 children || <= 6 age || pregnant", "generalInformation familyUnit", "sizeOfFamily");
        this.scoring.generalInformation++;
        this.issuesPresent.familyUnit.sizeOfFamily = true;
      }
    }
  }
}

clientPrototype.scoreHistoryOfHousingAndHomelessness = function() {
  this.scoring.historyOfHousingAndHomelessness = 0;

  var years = this.data.hLength.split("years");
  if (years.length === 2) {
    this.scoreTotalGte(years[0], 2, "historyOfHousingAndHomelessness", "historyOfHousingAndHomelessness");
  }

  this.scoreTotalGte(this.data.hTimes, 4, "historyOfHousingAndHomelessness", "historyOfHousingAndHomelessness");
}

clientPrototype.scoreRisks = function() {
  this.scoring.risks = 0;

  this.scoreTotalGte([this.data.rEmergencyServicesER, this.data.rEmergencyServicesPolice,
    this.data.rEmergencyServicesAmbulance, this.data.rEmergencyServicesCrisisService,
    this.data.rEmergencyServicesHospitalized], 4, "risks", "interactionsWithEmergencyServices");

  this.scoreYes(this.data.rHarmAttacked, "risks", "harm");
  this.scoreYes(this.data.rHarmAttempt, "risks", "harm");

  this.scoreYes(this.data.rLegalIssues, "risks", "legalIssues");

  this.scoreYes(this.data.rHighRiskSituationsTricked, "risks", "involvementInHighRiskSituations");
  this.scoreYes(this.data.rHighRiskSituationsRiskyActivites, "risks", "involvementInHighRiskSituations");
  this.scoreValueOtherThan(this.data.rHighRiskSituationsSleepingPlace, "Shelter", "risks", "involvementInHighRiskSituations");
}

clientPrototype.scoreSocialization = function() {
  this.scoring.socialization = 0;

  this.scoreYes(this.data.sMoneyManagementStreetDebt, "socialization", "moneyManagement");
  this.scoreNo(this.data.sMoneyManagementSteadyIncome, "socialization", "moneyManagement");
  this.scoreNo(this.data.sMoneyManagementEnoughIncome, "socialization", "moneyManagement");

  this.scoreNo(this.data.sMeaningfulActivities, "socialization", "meaningfulActivities");

  this.scoreYes(this.data.sRelationshipsOutOfNecessityOnly, "socialization", "relationships");
  this.scoreYes(this.data.sRelationshipsBadInfluences, "socialization", "relationships");

  this.scoreYes(this.data.sSelfCarePoorHygieneObserved, "socialization", "selfCare");
}

clientPrototype.scoreWellness = function() {
  this.scoring.wellness = 0;

  this.scoreValueEq(this.data.wPhysicalHealthPrimaryHealthcareDestination, "Does not go for care", "wellness", "physicalHealth");

  this.scoreYes(this.data.wPhysicalHealthMedicalKidneyDisease, "wellness", "physicalHealth", "medical", true);
  this.scoreYes(this.data.wPhysicalHealthMedicalFrostBite, "wellness", "physicalHealth", "medical", true);
  this.scoreYes(this.data.wPhysicalHealthMedicalLiverDisease, "wellness", "physicalHealth", "medical", true);
  this.scoreYes(this.data.wPhysicalHealthMedicalHIV, "wellness", "physicalHealth", "medical", true);

  this.scoreYes(this.data.wPhysicalHealthOtherMedicalHeatStroke, "wellness", "physicalHealth", "otherMedical");
  this.scoreYes(this.data.wPhysicalHealthOtherMedicalHeartDisease, "wellness", "physicalHealth", "otherMedical");
  this.scoreYes(this.data.wPhysicalHealthOtherMedicalLungDisease, "wellness", "physicalHealth", "otherMedical");
  this.scoreYes(this.data.wPhysicalHealthOtherMedicalDiabetes, "wellness", "physicalHealth", "otherMedical");
  this.scoreYes(this.data.wPhysicalHealthOtherMedicalAsthma, "wellness", "physicalHealth", "otherMedical");
  this.scoreYes(this.data.wPhysicalHealthOtherMedicalCancer, "wellness", "physicalHealth", "otherMedical");
  this.scoreYes(this.data.wPhysicalHealthOtherMedicalHepatitisC, "wellness", "physicalHealth", "otherMedical");
  this.scoreYes(this.data.wPhysicalHealthOtherMedicalTuberculosis, "wellness", "physicalHealth", "otherMedical");
  this.scoreYes(this.data.wPhysicalHealthSeriousHealthConditionObserved, "wellness", "physicalHealth", "otherMedical");

  this.scoreYes(this.data.wSubstanceUseAbuse, "wellness", "substanceUse");
  this.scoreYes(this.data.wSubstanceUseHighConsumption, "wellness", "substanceUse");
  this.scoreYes(this.data.wSubstanceUseInjectionDrugUse, "wellness", "substanceUse");
  this.scoreYes(this.data.wSubstanceUseRelapse, "wellness", "substanceUse");
  this.scoreYes(this.data.wSubstanceUsePassedOut, "wellness", "substanceUse");
  if (this.family()) {
    this.scoreYes(this.data.wFSubstanceUseChildAbusing, "wellness", "substanceUse");
  }
  this.scoreYes(this.data.wSubstanceUseAbuseObserved, "wellness", "substanceUse");

  this.scoreYes(this.data.wMentalHealthInvoluntaryCommittment, "wellness", "mentalHealth");
  this.scoreYes(this.data.wMentalHealthER, "wellness", "mentalHealth");
  this.scoreYes(this.data.wMentalHealthSeenProfessional, "wellness", "mentalHealth");
  this.scoreYes(this.data.wMentalHealthCognitiveHeadTrauma, "wellness", "mentalHealth");
  this.scoreYes(this.data.wMentalHealthCognitiveLearningDisability, "wellness", "mentalHealth");
  this.scoreYes(this.data.wMentalHealthCognitiveMemoryProblems, "wellness", "mentalHealth");
  this.scoreYes(this.data.wMentalHealthSeriousMentalHealthIssueObserved, "wellness", "mentalHealth");

  if ((this.issuesPresent.wellness.medical || this.issuesPresent.wellness.otherMedical) &&
      this.issuesPresent.wellness.substanceUse &&
      this.issuesPresent.wellness.mentalHealth) {
    if (this.individual()) {
      this.scoring.wellness++;
      this.issuesPresent.wellness.trimorbidity = true;
    } else if (this.family()) {
      this.scoreYes(this.data.wFMentalHealthTriMorbidSameFamilyMember, "wellness", "trimorbidity");
    }
  }

  this.scoreYes(this.data.wMedicationsMisuse, "wellness", "medication");

  this.scoreYes(this.data.wAbuseOrTraumaYesOrNo, "wellness", "abuseOrTrauma");
}

clientPrototype.scoreFamilyUnit = function() {
  if (this.family()) {
    this.scoring.familyUnit = 0;

    this.scoreYes(this.data.fParentalEngagementChildrenUnsupervised, "familyUnit", "parentalEngagement");
    this.scoreYes(this.data.fParentalEngagementExcessiveDelegation, "familyUnit", "parentalEngagement");

    this.scoreTotalGte(this.data.fStabilityTimesAdultsChanged, 3, "familyUnit", "stability");
    this.scoreTotalGte(this.data.fStabilityTimesSeparated, 3, "familyUnit", "stability");

    this.scoreYes(this.data.fNeedsOfChildrenMissingSchool, "familyUnit", "needsOfChildren");
    this.scoreYes(this.data.fNeedsOfChildrenLivingElsewhere, "familyUnit", "needsOfChildren");

    this.scoreYes(this.data.fInteractionsWithDCFAny, "familyUnit", "interactionsWithDCF");
    this.scoreYes(this.data.fInteractionsWithDCFFamilyCourt, "familyUnit", "interactionsWithDCF");
  }
}

clientPrototype.scoreTotal = function() {
  this.scoring.total = this.scoring.generalInformation +
    this.scoring.historyOfHousingAndHomelessness +
    this.scoring.risks +
    this.scoring.socialization +
    this.scoring.wellness;

  if (this.individual()) {
    if (this.scoring.total >= 10) {
      this.interventionRecommendation = "Housing First";
    } else if (this.scoring.total >= 5) {
      this.interventionRecommendation = "Rapid Rehousing";
    } else if (this.scoring.total >= 0 ) {
      this.interventionRecommendation = "Housing Help";
    }
  } else if (this.family()) {
    this.scoring.total += this.scoring.familyUnit;
    if (this.scoring.total >= 12) {
      this.interventionRecommendation = "Housing First";
    } else if (this.scoring.total >= 6) {
      this.interventionRecommendation = "Rapid Rehousing";
    } else if (this.scoring.total >= 0 ) {
      this.interventionRecommendation = "Housing Help";
    }
  }
}

request('http://localhost:8000/prescreens.csv', function(error, response, body) {

  if (!error && response.statusCode == 200) {
    var csv = baby.parse(body, { header: true }), output = [];

    for (var i = 0; i < csv.data.length; i++) {

      var client = Object.create(clientPrototype);

      client.init(csv.data[i]);
      client.scoreGeneralInformation();
      client.scoreHistoryOfHousingAndHomelessness();
      client.scoreRisks();
      client.scoreSocialization();
      client.scoreWellness();
      client.scoreFamilyUnit();
      client.scoreTotal();

      output.push({
        surveyId: client.data.id,
        type: client.data.type,
        scoringGeneralInformation: client.scoring.generalInformation,
        scoringHistoryOfHousingAndHomelessness: client.scoring.historyOfHousingAndHomelessness,
        scoringRisks: client.scoring.risks,
        scoringSocialization: client.scoring.socialization,
        scoringWellness: client.scoring.wellness,
        scoringFamilyUnit: client.scoring.familyUnit,
        scoringTotal: client.scoring.total,
        interventionRecommendation: client.interventionRecommendation,
        issuesPresentWellnessPhysicalHealth: client.issuesPresent.wellness.physicalHealth,
        issuesPresentWellnessMentalHealth: client.issuesPresent.wellness.mentalHealth,
        issuesPresentWellnessMedication: client.issuesPresent.wellness.medication,
        issuesPresentWellnessSubstanceUse: client.issuesPresent.wellness.substanceUse,
        issuesPresentWellnessAbuseOrTrauma: client.issuesPresent.wellness.abuseOrTrauma,
        issuesPresentRisksInteractionsWithEmergencyServices: client.issuesPresent.risks.interactionsWithEmergencyServices,
        issuesPresentRisksInvolvementInHighRiskSituations: client.issuesPresent.risks.involvementInHighRiskSituations,
        issuesPresentRisksManagingTenancy: client.issuesPresent.risks.managingTenancy,
        issuesPresentRisksHarm: client.issuesPresent.risks.harm,
        issuesPresentRisksLegalIssues: client.issuesPresent.risks.legalIssues,
        issuesPresentSocializationSelfCare: client.issuesPresent.socialization.selfCare,
        issuesPresentSocializationRelationships: client.issuesPresent.socialization.relationships,
        issuesPresentSocializationMeaningfulActivites: client.issuesPresent.socialization.meaningfulActivities,
        issuesPresentSocializationMoneyManagement: client.issuesPresent.socialization.moneyManagement,
        issuesPresentHistoryOfHousingandHomelessness: client.issuesPresent.historyOfHousingAndHomelessness.historyOfHousingAndHomelessness,
        issuesPresentFamilyUnitParentalEngagement: client.issuesPresent.familyUnit.parentalEngagement,
        issuesPresentFamilyUnitStability: client.issuesPresent.familyUnit.stability,
        issuesPresentFamilyUnitNeedsOfChildren: client.issuesPresent.familyUnit.needsOfChildren,
        issuesPresentFamilyUnitSizeOfFamily: client.issuesPresent.familyUnit.sizeOfFamily,
        issuesPresentFamilyUnitInteractionsWithDCF: client.issuesPresent.familyUnit.interactionsWithDCF
      });
    }

    var outputCsv = baby.unparse(output);
    console.log(outputCsv);

  }

});
