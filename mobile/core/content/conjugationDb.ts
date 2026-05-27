// Saybon v2 — Curated Offline Verb Conjugations
// Provides high-fidelity, accurate grammar assets for offline conjugation practice.

export interface ConjugationForm {
  subject: 'je' | 'tu' | 'il/elle' | 'nous' | 'vous' | 'ils/elles';
  form: string;
  sentence: string; // A complete simple practice sentence
  english: string;  // English translation of the sentence
}

export interface VerbEntry {
  verb: string;
  english: string;
  tenses: {
    [tense: string]: ConjugationForm[];
  };
}

export const conjugationDb: VerbEntry[] = [
  {
    verb: 'être',
    english: 'to be',
    tenses: {
      'présent': [
        { subject: 'je', form: 'suis', sentence: 'Je suis fatigué ce soir.', english: 'I am tired tonight.' },
        { subject: 'tu', form: 'es', sentence: 'Tu es très gentil.', english: 'You are very kind.' },
        { subject: 'il/elle', form: 'est', sentence: 'Il est étudiant à Montréal.', english: 'He is a student in Montreal.' },
        { subject: 'nous', form: 'sommes', sentence: 'Nous sommes prêts pour le cours.', english: 'We are ready for the class.' },
        { subject: 'vous', form: 'êtes', sentence: 'Vous êtes en retard aujourd’hui.', english: 'You are late today.' },
        { subject: 'ils/elles', form: 'sont', sentence: 'Ils sont d’accord avec le plan.', english: 'They agree with the plan.' }
      ],
      'imparfait': [
        { subject: 'je', form: 'étais', sentence: 'J’étais jeune quand j’habitais ici.', english: 'I was young when I lived here.' },
        { subject: 'tu', form: 'étais', sentence: 'Tu étais toujours de bonne humeur.', english: 'You were always in a good mood.' },
        { subject: 'il/elle', form: 'était', sentence: 'Le temps était magnifique hier.', english: 'The weather was beautiful yesterday.' },
        { subject: 'nous', form: 'étions', sentence: 'Nous étions heureux de te voir.', english: 'We were happy to see you.' },
        { subject: 'vous', form: 'étiez', sentence: 'Vous étiez en train de lire.', english: 'You were reading.' },
        { subject: 'ils/elles', form: 'étaient', sentence: 'Elles étaient absentes la semaine dernière.', english: 'They were absent last week.' }
      ],
      'passé composé': [
        { subject: 'je', form: 'ai été', sentence: 'J’ai été surpris par cette nouvelle.', english: 'I was surprised by this news.' },
        { subject: 'tu', form: 'as été', sentence: 'Tu as été très courageux.', english: 'You were very brave.' },
        { subject: 'il/elle', form: 'a été', sentence: 'Le spectacle a été un grand succès.', english: 'The show was a great success.' },
        { subject: 'nous', form: 'avons été', sentence: 'Nous avons été bien accueillis.', english: 'We were well received.' },
        { subject: 'vous', form: 'avez été', sentence: 'Vous avez été formidable hier soir.', english: 'You were formidable last night.' },
        { subject: 'ils/elles', form: 'ont été', sentence: 'Ils ont été malades après le dîner.', english: 'They were sick after dinner.' }
      ],
      'futur proche': [
        { subject: 'je', form: 'vais être', sentence: 'Je vais être en vacances demain.', english: 'I am going to be on vacation tomorrow.' },
        { subject: 'tu', form: 'vas être', sentence: 'Tu vas être surpris de voir Paul.', english: 'You are going to be surprised to see Paul.' },
        { subject: 'il/elle', form: 'va être', sentence: 'Le train va être en retard.', english: 'The train is going to be late.' },
        { subject: 'nous', form: 'allons être', sentence: 'Nous allons être très occupés ce week-end.', english: 'We are going to be very busy this weekend.' },
        { subject: 'vous', form: 'allez être', sentence: 'Vous allez être contents du résultat.', english: 'You are going to be happy with the result.' },
        { subject: 'ils/elles', form: 'vont être', sentence: 'Ils vont être fatigués après le voyage.', english: 'They are going to be tired after the trip.' }
      ],
      'subjonctif présent': [
        { subject: 'je', form: 'sois', sentence: 'Il faut que je sois à l’heure.', english: 'I must be on time.' },
        { subject: 'tu', form: 'sois', sentence: 'Je veux que tu sois heureux.', english: 'I want you to be happy.' },
        { subject: 'il/elle', form: 'soit', sentence: 'Il est possible qu’il soit en retard.', english: 'It is possible he is late.' },
        { subject: 'nous', form: 'soyons', sentence: 'Bien que nous soyons fatigués, nous continuerons.', english: 'Although we are tired, we will continue.' },
        { subject: 'vous', form: 'soyez', sentence: 'Il est important que vous soyez attentifs.', english: 'It is important that you be attentive.' },
        { subject: 'ils/elles', form: 'soient', sentence: 'Je doute qu’ils soient d’accord.', english: 'I doubt they agree.' }
      ]
    }
  },
  {
    verb: 'avoir',
    english: 'to have',
    tenses: {
      'présent': [
        { subject: 'je', form: 'ai', sentence: 'J’ai vingt-cinq ans.', english: 'I am twenty-five years old.' },
        { subject: 'tu', form: 'as', sentence: 'Tu as une belle voiture.', english: 'You have a nice car.' },
        { subject: 'il/elle', form: 'a', sentence: 'Il a besoin d’aide pour son travail.', english: 'He needs help for his work.' },
        { subject: 'nous', form: 'avons', sentence: 'Nous avons beaucoup de temps.', english: 'We have a lot of time.' },
        { subject: 'vous', form: 'avez', sentence: 'Vous avez de la chance.', english: 'You are lucky.' },
        { subject: 'ils/elles', form: 'ont', sentence: 'Ils ont deux chiens adorables.', english: 'They have two lovely dogs.' }
      ],
      'imparfait': [
        { subject: 'je', form: 'avais', sentence: 'J’avais peur du noir quand j’étais petit.', english: 'I was afraid of the dark when I was little.' },
        { subject: 'tu', form: 'avais', sentence: 'Tu avais toujours de bonnes idées.', english: 'You always had good ideas.' },
        { subject: 'il/elle', form: 'avait', sentence: 'Elle avait un grand sourire.', english: 'She had a big smile.' },
        { subject: 'nous', form: 'avions', sentence: 'Nous avions hâte de partir.', english: 'We were eager to leave.' },
        { subject: 'vous', form: 'aviez', sentence: 'Vous aviez beaucoup d’amis à l’école.', english: 'You had many friends at school.' },
        { subject: 'ils/elles', form: 'avaient', sentence: 'Ils avaient faim après la randonnée.', english: 'They were hungry after the hike.' }
      ],
      'passé composé': [
        { subject: 'je', form: 'ai eu', sentence: 'J’ai eu de la chance d’être invité.', english: 'I was lucky to be invited.' },
        { subject: 'tu', form: 'as eu', sentence: 'Tu as eu peur, n’est-ce pas ?', english: 'You got scared, didn’t you?' },
        { subject: 'il/elle', form: 'a eu', sentence: 'Il a eu un accident hier.', english: 'He had an accident yesterday.' },
        { subject: 'nous', form: 'avons eu', sentence: 'Nous avons eu une réunion importante ce matin.', english: 'We had an important meeting this morning.' },
        { subject: 'vous', form: 'avez eu', sentence: 'Vous avez eu une excellente note !', english: 'You got an excellent grade!' },
        { subject: 'ils/elles', form: 'ont eu', sentence: 'Elles ont eu des fleurs pour leur anniversaire.', english: 'They received flowers for their birthday.' }
      ],
      'futur proche': [
        { subject: 'je', form: 'vais avoir', sentence: 'Je vais avoir besoin d’un nouveau cahier.', english: 'I am going to need a new notebook.' },
        { subject: 'tu', form: 'vas avoir', sentence: 'Tu vas avoir froid sans veste.', english: 'You are going to be cold without a jacket.' },
        { subject: 'il/elle', form: 'va avoir', sentence: 'Il va avoir vingt ans le mois prochain.', english: 'He is going to turn twenty next month.' },
        { subject: 'nous', form: 'allons avoir', sentence: 'Nous allons avoir de la visite ce soir.', english: 'We are going to have visitors tonight.' },
        { subject: 'vous', form: 'allez avoir', sentence: 'Vous allez avoir beaucoup de travail.', english: 'You are going to have a lot of work.' },
        { subject: 'ils/elles', form: 'vont avoir', sentence: 'Ils vont avoir des surprises.', english: 'They are going to have surprises.' }
      ],
      'subjonctif présent': [
        { subject: 'je', form: 'aie', sentence: 'Il faut que j’aie mon passeport.', english: 'I must have my passport.' },
        { subject: 'tu', form: 'aies', sentence: 'Je souhaite que tu aies du succès.', english: 'I wish you success.' },
        { subject: 'il/elle', form: 'ait', sentence: 'Il est important qu’elle ait son dictionnaire.', english: 'It is important that she has her dictionary.' },
        { subject: 'nous', form: 'ayons', sentence: 'Il faut que nous ayons du courage.', english: 'We must have courage.' },
        { subject: 'vous', form: 'ayez', sentence: 'Il est nécessaire que vous ayez de la patience.', english: 'It is necessary that you have patience.' },
        { subject: 'ils/elles', form: 'aient', sentence: 'Je crains qu’ils n’aient pas de temps.', english: 'I fear they have no time.' }
      ]
    }
  },
  {
    verb: 'faire',
    english: 'to do / make',
    tenses: {
      'présent': [
        { subject: 'je', form: 'fais', sentence: 'Je fais mes devoirs de français.', english: 'I am doing my French homework.' },
        { subject: 'tu', form: 'fais', sentence: 'Tu fais du sport tous les matins.', english: 'You do sports every morning.' },
        { subject: 'il/elle', form: 'fait', sentence: 'Il fait beau aujourd’hui.', english: 'The weather is beautiful today.' },
        { subject: 'nous', form: 'faisons', sentence: 'Nous faisons une promenade dans le parc.', english: 'We are taking a walk in the park.' },
        { subject: 'vous', form: 'faites', sentence: 'Que faites-vous ce week-end ?', english: 'What are you doing this weekend?' },
        { subject: 'ils/elles', form: 'font', sentence: 'Ils font du bruit dans la bibliothèque.', english: 'They are making noise in the library.' }
      ],
      'imparfait': [
        { subject: 'je', form: 'faisais', sentence: 'Je faisais du piano quand j’étais jeune.', english: 'I used to play piano when I was young.' },
        { subject: 'tu', form: 'faisais', sentence: 'Tu faisais toujours de bons gâteaux.', english: 'You always made good cakes.' },
        { subject: 'il/elle', form: 'faisait', sentence: 'Il faisait froid la nuit dernière.', english: 'It was cold last night.' },
        { subject: 'nous', form: 'faisions', sentence: 'Nous faisions attention aux détails.', english: 'We paid attention to details.' },
        { subject: 'vous', form: 'faisiez', sentence: 'Vous faisiez la vaisselle tous les soirs.', english: 'You did the dishes every night.' },
        { subject: 'ils/elles', form: 'faisaient', sentence: 'Ils faisaient de la recherche sur ce sujet.', english: 'They were researching this topic.' }
      ],
      'passé composé': [
        { subject: 'je', form: 'ai fait', sentence: 'J’ai fait une erreur dans ma réponse.', english: 'I made a mistake in my answer.' },
        { subject: 'tu', form: 'as fait', sentence: 'Tu as fait un travail fantastique !', english: 'You did a fantastic job!' },
        { subject: 'il/elle', form: 'a fait', sentence: 'Elle a fait des biscuits pour la fête.', english: 'She made cookies for the party.' },
        { subject: 'nous', form: 'avons fait', sentence: 'Nous avons fait des courses au supermarché.', english: 'We did some shopping at the supermarket.' },
        { subject: 'vous', form: 'avez fait', sentence: 'Vous avez fait un choix difficile.', english: 'You made a difficult choice.' },
        { subject: 'ils/elles', form: 'ont fait', sentence: 'Ils ont fait des progrès remarquables.', english: 'They made remarkable progress.' }
      ],
      'futur proche': [
        { subject: 'je', form: 'vais faire', sentence: 'Je vais faire du café.', english: 'I am going to make coffee.' },
        { subject: 'tu', form: 'vas faire', sentence: 'Tu vas faire les courses ce soir ?', english: 'Are you going to do the shopping tonight?' },
        { subject: 'il/elle', form: 'va faire', sentence: 'Il va faire froid ce soir.', english: 'It is going to be cold tonight.' },
        { subject: 'nous', form: 'allons faire', sentence: 'Nous allons faire un voyage au Québec.', english: 'We are going to make a trip to Quebec.' },
        { subject: 'vous', form: 'allez faire', sentence: 'Qu’allez-vous faire après le cours ?', english: 'What are you going to do after class?' },
        { subject: 'ils/elles', form: 'vont faire', sentence: 'Ils vont faire de leur mieux.', english: 'They are going to do their best.' }
      ],
      'subjonctif présent': [
        { subject: 'je', form: 'fasse', sentence: 'Il faut que je fasse un effort.', english: 'I must make an effort.' },
        { subject: 'tu', form: 'fasses', sentence: 'Je veux que tu fasses attention.', english: 'I want you to pay attention.' },
        { subject: 'il/elle', form: 'fasse', sentence: 'Il est nécessaire qu’elle fasse ses devoirs.', english: 'It is necessary that she does her homework.' },
        { subject: 'nous', form: 'fassions', sentence: 'Il est bon que nous fassions une pause.', english: 'It is good that we take a break.' },
        { subject: 'vous', form: 'fassiez', sentence: 'Je crains que vous ne fassiez fausse route.', english: 'I fear you are going the wrong way.' },
        { subject: 'ils/elles', form: 'fassent', sentence: 'Il faut qu’ils fassent leurs bagages.', english: 'They must pack their bags.' }
      ]
    }
  },
  {
    verb: 'aller',
    english: 'to go',
    tenses: {
      'présent': [
        { subject: 'je', form: 'vais', sentence: 'Je vais à l’école à pied.', english: 'I go to school on foot.' },
        { subject: 'tu', form: 'vas', sentence: 'Tu vas au cinéma ce soir ?', english: 'Are you going to the cinema tonight?' },
        { subject: 'il/elle', form: 'va', sentence: 'Il va très bien, merci.', english: 'He is doing very well, thank you.' },
        { subject: 'nous', form: 'allons', sentence: 'Nous allons au restaurant ce week-end.', english: 'We are going to the restaurant this weekend.' },
        { subject: 'vous', form: 'allez', sentence: 'Comment allez-vous ?', english: 'How are you?' },
        { subject: 'ils/elles', form: 'vont', sentence: 'Ils vont à la bibliothèque pour étudier.', english: 'They are going to the library to study.' }
      ],
      'imparfait': [
        { subject: 'je', form: 'allais', sentence: 'J’allais souvent au parc quand j’étais jeune.', english: 'I often went to the park when I was young.' },
        { subject: 'tu', form: 'allais', sentence: 'Tu allais chez tes grands-parents chaque été.', english: 'You went to your grandparents every summer.' },
        { subject: 'il/elle', form: 'allait', sentence: 'Elle allait à la piscine le samedi.', english: 'She went to the pool on Saturdays.' },
        { subject: 'nous', form: 'allions', sentence: 'Nous allions au marché ensemble.', english: 'We went to the market together.' },
        { subject: 'vous', form: 'alliez', sentence: 'Où alliez-vous quand je vous ai vu ?', english: 'Where were you going when I saw you?' },
        { subject: 'ils/elles', form: 'allaient', sentence: 'Elles allaient au théâtre tous les mois.', english: 'They went to the theater every month.' }
      ],
      'passé composé': [
        { subject: 'je', form: 'suis allé', sentence: 'Je suis allé au Canada l’été dernier.', english: 'I went to Canada last summer.' },
        { subject: 'tu', form: 'es allé', sentence: 'Tu es allé chez le médecin ?', english: 'Did you go to the doctor?' },
        { subject: 'il/elle', form: 'est allé', sentence: 'Elle est allée à Paris en train.', english: 'She went to Paris by train.' },
        { subject: 'nous', form: 'sommes allés', sentence: 'Nous sommes allés au concert de jazz.', english: 'We went to the jazz concert.' },
        { subject: 'vous', form: 'êtes allés', sentence: 'Vous êtes allés au musée d’art moderne.', english: 'You went to the modern art museum.' },
        { subject: 'ils/elles', form: 'sont allés', sentence: 'Ils sont allés skier dans les Alpes.', english: 'They went skiing in the Alps.' }
      ],
      'futur proche': [
        { subject: 'je', form: 'vais aller', sentence: 'Je vais aller à la poste.', english: 'I am going to go to the post office.' },
        { subject: 'tu', form: 'vas aller', sentence: 'Tu vas aller au lit bientôt ?', english: 'Are you going to go to bed soon?' },
        { subject: 'il/elle', form: 'va aller', sentence: 'Il va aller au Canada le mois prochain.', english: 'He is going to go to Canada next month.' },
        { subject: 'nous', form: 'allons aller', sentence: 'Nous allons aller faire des courses.', english: 'We are going to go shopping.' },
        { subject: 'vous', form: 'allez aller', sentence: 'Où allez-vous aller ce week-end ?', english: 'Where are you going to go this weekend?' },
        { subject: 'ils/elles', form: 'vont aller', sentence: 'Ils vont aller voir un match de soccer.', english: 'They are going to go watch a soccer match.' }
      ],
      'subjonctif présent': [
        { subject: 'je', form: 'aille', sentence: 'Il faut que j’aille au travail.', english: 'I must go to work.' },
        { subject: 'tu', form: 'ailles', sentence: 'Je désire que tu ailles avec lui.', english: 'I want you to go with him.' },
        { subject: 'il/elle', form: 'aille', sentence: 'Il est surprenant qu’il aille si tôt.', english: 'It is surprising that he goes so early.' },
        { subject: 'nous', form: 'allions', sentence: 'Il est important que nous allions à cette réunion.', english: 'It is important that we go to this meeting.' },
        { subject: 'vous', form: 'alliez', sentence: 'Je veux que vous alliez tout de suite.', english: 'I want you to go immediately.' },
        { subject: 'ils/elles', form: 'aillent', sentence: 'Il est nécessaire qu’elles y aillent.', english: 'It is necessary that they go there.' }
      ]
    }
  },
  {
    verb: 'manger',
    english: 'to eat',
    tenses: {
      'présent': [
        { subject: 'je', form: 'mange', sentence: 'Je mange une pomme rouge.', english: 'I am eating a red apple.' },
        { subject: 'tu', form: 'manges', sentence: 'Tu manges de la pizza tous les vendredis.', english: 'You eat pizza every Friday.' },
        { subject: 'il/elle', form: 'mange', sentence: 'Il mange un sandwich dans le parc.', english: 'He is eating a sandwich in the park.' },
        { subject: 'nous', form: 'mangeons', sentence: 'Nous mangeons ensemble à midi.', english: 'We are eating together at noon.' },
        { subject: 'vous', form: 'mangez', sentence: 'Mangez-vous des fruits tous les jours ?', english: 'Do you eat fruit every day?' },
        { subject: 'ils/elles', form: 'mangent', sentence: 'Ils mangent un excellent gâteau au chocolat.', english: 'They are eating an excellent chocolate cake.' }
      ],
      'imparfait': [
        { subject: 'je', form: 'mangeais', sentence: 'Je mangeais une glace quand tu as appelé.', english: 'I was eating an ice cream when you called.' },
        { subject: 'tu', form: 'mangeais', sentence: 'Tu mangeais très lentement enfant.', english: 'You used to eat very slowly as a child.' },
        { subject: 'il/elle', form: 'mangeait', sentence: 'Elle mangeait une salade fraîche.', english: 'She was eating a fresh salad.' },
        { subject: 'nous', form: 'mangiions', sentence: 'Nous mangions souvent ensemble à cette époque.', english: 'We often ate together at that time.' },
        { subject: 'vous', form: 'mangiez', sentence: 'Vous mangiez du poisson le vendredi.', english: 'You used to eat fish on Fridays.' },
        { subject: 'ils/elles', form: 'mangeaient', sentence: 'Ils mangeaient leur dîner devant la télé.', english: 'They were eating their dinner in front of the TV.' }
      ],
      'passé composé': [
        { subject: 'je', form: 'ai mangé', sentence: 'J’ai mangé dans un très bon restaurant.', english: 'I ate at a very good restaurant.' },
        { subject: 'tu', form: 'as mangé', sentence: 'Tu as mangé toute la tarte !', english: 'You ate the whole pie!' },
        { subject: 'il/elle', form: 'a mangé', sentence: 'Il a mangé trop vite et a mal au ventre.', english: 'He ate too fast and has a stomachache.' },
        { subject: 'nous', form: 'avons mangé', sentence: 'Nous avons mangé des spécialités québécoises.', english: 'We ate Quebec specialities.' },
        { subject: 'vous', form: 'avez mangé', sentence: 'Qu’avez-vous mangé ce midi ?', english: 'What did you eat at noon?' },
        { subject: 'ils/elles', form: 'ont mangé', sentence: 'Elles ont mangé du fromage avec du pain.', english: 'They ate cheese with bread.' }
      ],
      'futur proche': [
        { subject: 'je', form: 'vais manger', sentence: 'Je vais manger une soupe chaude.', english: 'I am going to eat a hot soup.' },
        { subject: 'tu', form: 'vas manger', sentence: 'Tu vas manger avec nous ?', english: 'Are you going to eat with us?' },
        { subject: 'il/elle', form: 'va manger', sentence: 'Il va manger une pomme pour le goûter.', english: 'He is going to eat an apple for a snack.' },
        { subject: 'nous', form: 'allons manger', sentence: 'Nous allons manger du poisson ce soir.', english: 'We are going to eat fish tonight.' },
        { subject: 'vous', form: 'allez manger', sentence: 'Quand allez-vous manger votre dîner ?', english: 'When are you going to eat your dinner?' },
        { subject: 'ils/elles', form: 'vont manger', sentence: 'Elles vont manger dehors ce soir.', english: 'They are going to eat outside tonight.' }
      ],
      'subjonctif présent': [
        { subject: 'je', form: 'mange', sentence: 'Il faut que je mange quelque chose.', english: 'I must eat something.' },
        { subject: 'tu', form: 'manges', sentence: 'Je veux que tu manges tes légumes.', english: 'I want you to eat your vegetables.' },
        { subject: 'il/elle', form: 'mange', sentence: 'Il est important qu’il mange équilibré.', english: 'It is important that he eats a balanced diet.' },
        { subject: 'nous', form: 'mangions', sentence: 'Il est bon que nous mangions plus de fruits.', english: 'It is good that we eat more fruits.' },
        { subject: 'vous', form: 'mangiez', sentence: 'Il faut que vous mangiez avant de partir.', english: 'You must eat before leaving.' },
        { subject: 'ils/elles', form: 'mangent', sentence: 'Je crains qu’elles ne mangent pas assez.', english: 'I fear they are not eating enough.' }
      ]
    }
  }
];
