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
  return this.data.fSizeOfFamilyFemaleHohPregnant;
}
clientPrototype.childCount = function() {
  return this.data.fSizeOfFamilyChildrenCurrentlyWith +
    this.data.fSizeOfFamilyChildrenExpectedToJoin;
}
clientPrototype.anyChildOfOrYounger = function(age) {
  return this.data.fSizeOfFamilyYoungestChildAge <= age;
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

  this.strengths = {};
  this.strengths.wellness = {};
  this.strengths.wellness.physicalHealth = [];
  this.strengths.wellness.mentalHealth = [];
  this.strengths.wellness.medication = [];
  this.strengths.wellness.substanceUse = [];
  this.strengths.wellness.abuseOrTrauma = [];
  this.strengths.risks = {};
  this.strengths.risks.interactionsWithEmergencyServices = [];
  this.strengths.risks.involvementInHighRiskSituations = [];
  this.strengths.risks.managingTenancy = [];
  this.strengths.risks.harm = [];
  this.strengths.risks.legalIssues = [];
  this.strengths.socialization = {};
  this.strengths.socialization.selfCare = [];
  this.strengths.socialization.relationships = [];
  this.strengths.socialization.meaningfulActivities = [];
  this.strengths.socialization.moneyManagement = [];

  this.strengths.historyOfHousingAndHomelessness = {};
  this.strengths.historyOfHousingAndHomelessness.historyOfHousingAndHomelessness = [];

  this.strengths.familyUnit = {};
  if (this.family()) {
    this.strengths.familyUnit.parentalEngagement = [];
    this.strengths.familyUnit.stability = [];
    this.strengths.familyUnit.needsOfChildren = [];
    this.strengths.familyUnit.sizeOfFamily = [];
    this.strengths.familyUnit.interactionsWithDCF = [];
  }

  this.issues = {};
  this.issues.wellness = {};
  this.issues.wellness.physicalHealth = [];
  this.issues.wellness.physicalHealth.medical = [];
  this.issues.wellness.physicalHealth.otherMedical = [];
  this.issues.wellness.mentalHealth = [];
  this.issues.wellness.medication = [];
  this.issues.wellness.substanceUse = [];
  this.issues.wellness.abuseOrTrauma = [];
  this.issues.risks = {};
  this.issues.risks.interactionsWithEmergencyServices = [];
  this.issues.risks.involvementInHighRiskSituations = [];
  this.issues.risks.managingTenancy = [];
  this.issues.risks.harm = [];
  this.issues.risks.legalIssues = [];
  this.issues.socialization = {};
  this.issues.socialization.selfCare = [];
  this.issues.socialization.relationships = [];
  this.issues.socialization.meaningfulActivities = [];
  this.issues.socialization.moneyManagement = [];

  this.issues.historyOfHousingAndHomelessness = {};
  this.issues.historyOfHousingAndHomelessness.historyOfHousingAndHomelessness = [];

  this.issues.familyUnit = {};
  if (this.family()) {
    this.issues.familyUnit.parentalEngagement = [];
    this.issues.familyUnit.stability = [];
    this.issues.familyUnit.needsOfChildren = [];
    this.issues.familyUnit.sizeOfFamily = [];
    this.issues.familyUnit.interactionsWithDCF = [];
  }

}

clientPrototype.scoreYesOrNo = function(yesOrNo, value, domain, component, strength, issue, dimension, set, forEach, trackOnly) {
  console.log(this.data.id, "scoring yes/no", yesOrNo, domain, component);
  if (typeof value === 'string') {
    value = [ value ];
  }
  var populated = false;
  for (var i = 0; i < value.length; i++) {
    var e = value[i];
    if (e != "" && e !== "refused") {
      e = parseInt(e);
      console.log("Answered", e, domain, component);
      if (e === yesOrNo) {
        if (!trackOnly) {
          if (dimension && forEach) {
            console.log("increment score", domain, "on dimension", dimension);
            this.scoring[domain]++;
          } else {
            if (!this.issuesPresent[domain][component]) {
              console.log("increment score", domain);
              this.scoring[domain]++;;
            }
          }
        }
        this.issuesPresent[domain][component] = true;
        if (!populated && issue) {
          console.log("recorded issue '" + issue + "'");
          this.issues[domain][component].push(issue);
          populated = true;
        }
        if (dimension) {
          this.issuesPresent[domain][dimension] = true;
          if (set) {
            console.log("recorded issue dimension '" + set[i] + "'");
            this.issues[domain][component][dimension].push(set[i]);
          }
        }
      } else {
        if (!populated && strength) {
          console.log("recorded strength '" + strength + "'");
          this.strengths[domain][component].push(strength);
          populated = true;
        }
      }
    }
  }
}

clientPrototype.scoreYes = function(value, domain, component, strength, issue, dimension, set, forEach, trackOnly) {
  this.scoreYesOrNo(1, value, domain, component, strength, issue, dimension, set, forEach, trackOnly)
}

clientPrototype.scoreNo = function(value, domain, component, strength, issue) {
  this.scoreYesOrNo(0, value, domain, component, strength, issue)
}

clientPrototype.scoreTotalGte = function(value, x, domain, component, strength, issue) {
  console.log(this.data.id, "scoring >= " + x, domain, component);
  if (typeof value === 'string') {
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
    if (!this.issuesPresent[domain][component]) {
      console.log("increment score", domain);
      this.scoring[domain]++;
    }
    this.issuesPresent[domain][component] = true;
    this.issues[domain][component].componentValue = value;
    if (issue) {
      console.log("recorded issue '" + issue + "'");
      this.issues[domain][component].push(issue);
    }
  } else {
    if (strength) {
      console.log("recorded strength '" + strength + "'");
      this.strengths[domain][component].push(strength);
    }
  }
}

clientPrototype.scoreValueEq = function(value, x, domain, component, strength, issue) {
  console.log(this.data.id, "scoring == " + x, domain, component);
  if (value && value !== "refused") {
    if (x === value) {
      console.log(this.data.id, "== " + x + ", scoring", domain, component);
      if (!this.issuesPresent[domain][component]) {
        console.log("Increment score", domain);
        this.scoring[domain]++;
      }
      this.issuesPresent[domain][component] = true;
      this.issues[domain][component].componentValue = value;
      if (issue) {
        console.log("recorded issue '" + issue + "'");
        this.issues[domain][component].push(issue);
      }
    } else {
      if (strength) {
        console.log("recorded strength '" + strength + "'");
        this.strengths[domain][component].push(strength);
      }
    }
  }
}

clientPrototype.scoreValueOtherThan = function(value, x, domain, component, strength, issue) {
  console.log(this.data.id, "scoring <> " + x, domain, component);
  if (value && value !== "refused") {
    if (x !== value) {
      console.log(this.data.id, "!= " + x + ", scoring", domain, component);
      if (!this.issuesPresent[domain][component]) {
        console.log("increment score", domain);
        this.scoring[domain]++;
      }
      this.issuesPresent[domain][component] = true;
      this.issues[domain][component].componentValue = value;
      if (issue) {
        console.log("recorded issue '" + issue + "'");
        this.issues[domain][component].push(issue);
      }
    } else {
      if (strength) {
        console.log("recorded strength '" + strength + "'");
        this.strengths[domain][component].push(strength);
      }
    }
  }
}

clientPrototype.scoreGeneralInformation = function() {
  this.scoring.generalInformation = 0;

  if (this.individual()) {
    if (this.data.hohAge >= 60) {
      console.log(this.data.id, "Scoring >= 60", "generalInformation")
      this.scoring.generalInformation++;
    }
  } else if (this.family()) {
    if (this.data.hohAge >= 60 || this.data.hoh2Age >= 60) {
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
  if (years.length > 1) {
    years = years[0];
  } else {
    years = 0;
  }
  this.scoreTotalGte(years, 2, "historyOfHousingAndHomelessness", "historyOfHousingAndHomelessness",
    "Homeless less than 2 years", "Homeless 2 or more years");

  this.scoreTotalGte(this.data.hTimes, 4, "historyOfHousingAndHomelessness", "historyOfHousingAndHomelessness",
    "Less than 4 episodes of homelessness", "4 or more episodes of homelessness");
}

clientPrototype.scoreRisks = function() {
  this.scoring.risks = 0;

  this.scoreTotalGte([this.data.rEmergencyServicesER, this.data.rEmergencyServicesPolice,
    this.data.rEmergencyServicesAmbulance, this.data.rEmergencyServicesCrisisService,
    this.data.rEmergencyServicesHospitalized], 4, "risks", "interactionsWithEmergencyServices",
    "Less than 4 emergency interactions in the last six months",
    "4 or more emergency interactions in the last six months");

  this.scoreYes(this.data.rHarmAttacked, "risks", "harm",
    "Not attacked since becoming homeless",
    "Attacked since becoming homeless");

  this.scoreYes(this.data.rHarmAttempt, "risks", "harm",
    "No threats or attempts at harm in the past year",
    "Threats or attempts at harm in the past year");

  this.scoreYes(this.data.rLegalIssues, "risks", "legalIssues",
    "No legal stuff going on",
    "At risk of being locked up or having to pay fines");

  this.scoreYes(this.data.rHighRiskSituationsTricked, "risks", "involvementInHighRiskSituations",
    "No one forces them do things they do not want to do",
    "People force them to do things they do not want to do");

  this.scoreYes(this.data.rHighRiskSituationsRiskyActivites, "risks", "involvementInHighRiskSituations",
    "Not engaging in risky activities", "Engaging in risky activities");

  this.scoreValueOtherThan(this.data.rHighRiskSituationsSleepingPlace, "Shelter", "risks", "involvementInHighRiskSituations",
    "Safe sleeping place", "Unsafe sleeping place");
}

clientPrototype.scoreSocialization = function() {
  this.scoring.socialization = 0;

  this.scoreYes(this.data.sMoneyManagementStreetDebt, "socialization", "moneyManagement",
    "Nobody thinks they owe them money", "People think they owe them money");

  this.scoreNo(this.data.sMoneyManagementSteadyIncome, "socialization", "moneyManagement",
    "Steady income", "No steady income");

  this.scoreNo(this.data.sMoneyManagementEnoughIncome, "socialization", "moneyManagement",
    "Enough income to meet expenses", "Not enough income to meet expenses");

  this.scoreNo(this.data.sMeaningfulActivities, "socialization", "meaningfulActivities",
    "Meaningful daily activities", "No meaningful daily activities");

  this.scoreYes(this.data.sRelationshipsOutOfNecessityOnly, "socialization", "relationships",
    "No relationships out of necessity", "Relationships out of necessity");
  this.scoreYes(this.data.sRelationshipsBadInfluences, "socialization", "relationships",
    "No bad influences", "Bad influences");

  this.scoreYes(this.data.sSelfCarePoorHygieneObserved, "socialization", "selfCare",
    "Good hygiene observed", "Poor hygiene observed");
}

clientPrototype.scoreWellness = function() {
  this.scoring.wellness = 0;

  this.scoreValueEq(this.data.wPhysicalHealthPrimaryHealthcareDestination, "Does not go for care", "wellness", "physicalHealth",
    "Goes for medical care", "Does not go for medical care");

  this.scoreYes([this.data.wPhysicalHealthMedicalKidneyDisease,
    this.data.wPhysicalHealthMedicalFrostBite,
    this.data.wPhysicalHealthMedicalLiverDisease,
    this.data.wPhysicalHealthMedicalHIV], "wellness", "physicalHealth",
    "No VI medical conditions present", "VI Medical conditions present", "medical",
    ["Kidney Disease", "Frostbite", "Liver Disease", "HIV+/AIDS" ], true);

  this.scoreYes([this.data.wPhysicalHealthOtherMedicalHeatStroke,
    this.data.wPhysicalHealthOtherMedicalHeartDisease,
    this.data.wPhysicalHealthOtherMedicalLungDisease,
    this.data.wPhysicalHealthOtherMedicalDiabetes,
    this.data.wPhysicalHealthOtherMedicalAsthma,
    this.data.wPhysicalHealthOtherMedicalCancer,
    this.data.wPhysicalHealthOtherMedicalHepatitisC,
    this.data.wPhysicalHealthOtherMedicalTuberculosis,
    ], "wellness", "physicalHealth",
    "No other medical conditions present", "Other medical conditions present", "otherMedical",
    ["Heat Exhaustion", "Heart Disease", "Lung Disease", "Diabetes", "Asthma", "Cancer", "Hepatitis C", "Tuberculosis"], false, true);

  this.scoreYes(this.data.wPhysicalHealthSeriousHealthConditionObserved, "wellness", "physicalHealth",
    "No serious health condition observed", "Serious health condition observed", "otherMedical", false, true);

  this.scoreYes(this.data.wSubstanceUseAbuse, "wellness", "substanceUse",
    "Clean", "Substance abuse");
  this.scoreYes(this.data.wSubstanceUseHighConsumption, "wellness", "substanceUse",
    "Lower consumption levels", "Daily consumption levels");
  this.scoreYes(this.data.wSubstanceUseInjectionDrugUse, "wellness", "substanceUse",
    "No injection drugs", "Injection drugs");
  this.scoreYes(this.data.wSubstanceUseRelapse, "wellness", "substanceUse",
    "Never relapsed", "Has relapsed");
  this.scoreYes(this.data.wSubstanceUseNonBeverageAlcohol, "wellness", "substanceUse",
    "No non-beverage alchohol", "Non-beverage alcohol");
  this.scoreYes(this.data.wSubstanceUsePassedOut, "wellness", "substanceUse",
    "Never passed out", "Has passed out");
  if (this.family()) {
    this.scoreYes(this.data.wFSubstanceUseChildAbusing, "wellness", "substanceUse",
      "Minors not abusing", "Minors abusing");
  }
  this.scoreYes(this.data.wSubstanceUseAbuseObserved, "wellness", "substanceUse",
    "No substance use problem observed", "Substance use problem observed");

  this.scoreYes(this.data.wMentalHealthInvoluntaryCommittment, "wellness", "mentalHealth",
    "Never committed involuntarily", "Committed involuntarily");
  this.scoreYes(this.data.wMentalHealthER, "wellness", "mentalHealth",
    "Never taken to the ER for nerves", "Taken to the ER for nerves");
  this.scoreYes(this.data.wMentalHealthSeenProfessional, "wellness", "mentalHealth",
    "Never spoken to a mental professional", "Spoken with a mental health professional");
  this.scoreYes(this.data.wMentalHealthCognitiveHeadTrauma, "wellness", "mentalHealth",
    "No head trauma", "Head trauma");
  this.scoreYes(this.data.wMentalHealthCognitiveLearningDisability, "wellness", "mentalHealth",
    "No learning disability", "Learning disability");
  this.scoreYes(this.data.wMentalHealthCognitiveMemoryProblems, "wellness", "mentalHealth",
    "No problems concentrating", "Problems concentrating");
  this.scoreYes(this.data.wMentalHealthSeriousMentalHealthIssueObserved, "wellness", "mentalHealth",
    "No severe mental illness observed", "Severe mental llness observed");

  console.log("medical", this.issuesPresent.wellness.medical, this.issuesPresent.wellness.otherMedical);
  if ((this.issuesPresent.wellness.medical || this.issuesPresent.wellness.otherMedical) &&
      this.issuesPresent.wellness.substanceUse &&
      this.issuesPresent.wellness.mentalHealth) {
    if (this.individual()) {
      this.scoring.wellness++;
      this.issuesPresent.wellness.trimorbidity = true;
      console.log("increment score wellness on dimension trimorbidity");
    } else if (this.family()) {
      this.scoreYes(this.data.wFMentalHealthTriMorbidSameFamilyMember, "wellness", "trimorbidity");
    }
  }

  this.scoreYes(this.data.wMedicationsMisuse, "wellness", "medication",
    "Follows prescription protocol", "Does not follow prescription protocol");

  this.scoreYes(this.data.wAbuseOrTraumaYesOrNo, "wellness", "abuseOrTrauma",
    "No abuse or trauma reported", "Abuse or trauma reported");
}

clientPrototype.scoreFamilyUnit = function() {
  if (this.family()) {
    this.scoring.familyUnit = 0;

    this.scoreYes(this.data.fParentalEngagementChildrenUnsupervised, "familyUnit", "parentalEngagement",
      "Children supervised", "Children left supervised");
    this.scoreYes(this.data.fParentalEngagementExcessiveDelegation, "familyUnit", "parentalEngagement",
      "Parental responsibility", "Excessive delegation of parental responsibility");

    this.scoreTotalGte(this.data.fStabilityTimesAdultsChanged, 3, "familyUnit", "stability",
      "Adults changed 3 or more times in the past year", "Adults changed less than 3 times in the past year");
    this.scoreTotalGte(this.data.fStabilityTimesSeparated, 3, "familyUnit", "stability",
      "Children separated 3 or more times in the past year", "Children separated less than 3 times in the past year");

    this.scoreYes(this.data.fNeedsOfChildrenMissingSchool, "familyUnit", "needsOfChildren",
      "Children attending school", "Children missing school");
    this.scoreYes(this.data.fNeedsOfChildrenLivingElsewhere, "familyUnit", "needsOfChildren",
      "Children in household for last six months", "Children living with a friend in the last six months");

    this.scoreYes(this.data.fInteractionsWithDCFAny, "familyUnit", "interactionsWithDCF",
      "No DCF interactions in last six months", "DCF interactions in last six months");
    this.scoreYes(this.data.fInteractionsWithDCFFamilyCourt, "familyUnit", "interactionsWithDCF",
      "No family court involvement in the last six months", "Family court involvement in the last six months");
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
    console.log(client);
    console.log(outputCsv);

  }

});
