import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(' Starte Seeding...');

  // Create admin user (if not exists)
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.dev';
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeMe';
  
  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        nick: 'admin',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        emailVerified: true,
        tokenVersion: 0,
      },
    });
    console.log(' Admin User erstellt');
  }

  // Create test user (if not exists)
  const testUserEmail = process.env.TEST_USER_EMAIL || 'testuser@example.dev';
  const testUserPassword = process.env.TEST_USER_PASSWORD || 'changeMe';
  
  let testUser = await prisma.user.findUnique({
    where: { email: testUserEmail },
  });

  if (!testUser) {
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(testUserPassword, 10);
    
    testUser = await prisma.user.create({
      data: {
        email: testUserEmail,
        nick: 'testuser',
        password: hashedPassword,
        role: 'USER',
        isActive: true,
        emailVerified: true,
        tokenVersion: 0,
      },
    });
    console.log(' Test User erstellt');
  }

  // Kategorien erstellen
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'konferenz' },
      update: {},
      create: { name: 'Konferenz', slug: 'konferenz' },
    }),
    prisma.category.upsert({
      where: { slug: 'workshop' },
      update: {},
      create: { name: 'Workshop', slug: 'workshop' },
    }),
    prisma.category.upsert({
      where: { slug: 'meetup' },
      update: {},
      create: { name: 'Meetup', slug: 'meetup' },
    }),
    prisma.category.upsert({
      where: { slug: 'webinar' },
      update: {},
      create: { name: 'Webinar', slug: 'webinar' },
    }),
    prisma.category.upsert({
      where: { slug: 'hackathon' },
      update: {},
      create: { name: 'Hackathon', slug: 'hackathon' },
    }),
  ]);

  console.log(' Kategorien erstellt');

  // Events with realistic German tech locations
  const events = [
    {
      name: 'KI Summit Berlin 2026',
      slug: 'ki-summit-berlin-2026',
      dateStart: new Date('2026-03-15T09:00:00Z'),
      dateEnd: new Date('2026-03-17T18:00:00Z'),
      description: 'Die führende Konferenz für Künstliche Intelligenz und Machine Learning im deutschsprachigen Raum. Über 3 Tage erwarten Sie keynotes von internationalen KI-Experten, Workshops zu Deep Learning und neuronalen Netzen sowie Networking-Events mit den Top-Playern der Branche.',
      categoryId: categories[0].id,
      userId: adminUser.id,
      published: true,
      orgaName: 'Tech Summit GmbH',
      orgaWebsite: 'https://techsummit.de',
      eventWebsite: 'https://kisummit-berlin.de',
      eventAddress: 'Messe Berlin, Messedamm 22, 14055 Berlin',
      registrationLink: 'https://kisummit-berlin.de/tickets',
      isOnlineEvent: false,
      tags: ['KI', 'Machine Learning', 'Deep Learning', 'Innovation'],
    },
    {
      name: 'Cloud Native Day München',
      slug: 'cloud-native-day-muenchen',
      dateStart: new Date('2026-04-08T09:00:00Z'),
      dateEnd: new Date('2026-04-08T18:00:00Z'),
      description: 'Tauchen Sie ein in die Welt von Kubernetes, Docker und Cloud-Native Technologien. Praxisnahe Sessions zu Microservices, Container-Orchestrierung und DevOps Best Practices.',
      categoryId: categories[0].id,
      userId: adminUser.id,
      published: true,
      orgaName: 'Cloud Native Community München',
      orgaWebsite: 'https://cloudnative-muc.de',
      eventWebsite: 'https://cloudnativeday-muc.de',
      eventAddress: 'Google Munich, Erika-Mann-Straße 33, 80636 München',
      registrationLink: 'https://cloudnativeday-muc.de/register',
      isOnlineEvent: false,
      tags: ['Kubernetes', 'Docker', 'DevOps', 'Cloud'],
    },
    {
      name: 'React Advanced Workshop Hamburg',
      slug: 'react-advanced-workshop-hamburg',
      dateStart: new Date('2026-04-20T10:00:00Z'),
      dateEnd: new Date('2026-04-21T17:00:00Z'),
      description: 'Zweitägiger Intensiv-Workshop zu fortgeschrittenen React-Patterns, Performance-Optimierung und Server Components. Begrenzte Teilnehmerzahl für maximalen Lernerfolg.',
      categoryId: categories[1].id,
      userId: adminUser.id,
      published: true,
      orgaName: 'Frontend Masters Europe',
      orgaWebsite: 'https://frontendmasters-eu.com',
      eventWebsite: 'https://react-workshop-hh.de',
      eventAddress: 'Mindspace Hamburg, Neuer Wall 63, 20354 Hamburg',
      registrationLink: 'https://react-workshop-hh.de/anmeldung',
      isOnlineEvent: false,
      tags: ['React', 'Frontend', 'JavaScript', 'Web Development'],
    },
    {
      name: 'Cybersecurity Summit Frankfurt',
      slug: 'cybersecurity-summit-frankfurt',
      dateStart: new Date('2026-05-12T09:00:00Z'),
      dateEnd: new Date('2026-05-14T18:00:00Z'),
      description: 'Die zentrale Anlaufstelle für IT-Security Professionals. Erfahren Sie mehr über Zero Trust Architecture, Ransomware-Prevention und Security-Automation. Mit Live-Hacking-Demos und CTF-Challenge.',
      categoryId: categories[0].id,
      userId: adminUser.id,
      published: true,
      orgaName: 'CyberSec Institute',
      orgaWebsite: 'https://cybersec-institute.de',
      eventWebsite: 'https://cybersummit-ffm.de',
      eventAddress: 'Messe Frankfurt, Ludwig-Erhard-Anlage 1, 60327 Frankfurt am Main',
      registrationLink: 'https://cybersummit-ffm.de/tickets',
      isOnlineEvent: false,
      tags: ['Security', 'Cybersecurity', 'Hacking', 'Zero Trust'],
    },
    {
      name: 'Kotlin Meetup Köln',
      slug: 'kotlin-meetup-koeln',
      dateStart: new Date('2026-02-18T18:30:00Z'),
      dateEnd: new Date('2026-02-18T21:00:00Z'),
      description: 'Monatliches Treffen der Kotlin-Community Köln. Diesmal mit Talks zu Kotlin Multiplatform und Compose. Pizza und Getränke inklusive!',
      categoryId: categories[2].id,
      userId: adminUser.id,
      published: true,
      orgaName: 'Kotlin User Group Köln',
      orgaWebsite: 'https://kotlin-koeln.de',
      eventAddress: 'Coworking Space Köln, Clever Straße 13-15, 50668 Köln',
      registrationLink: 'https://meetup.com/kotlin-koeln',
      isOnlineEvent: false,
      tags: ['Kotlin', 'Android', 'Multiplatform', 'Compose'],
    },
    {
      name: 'Online: TypeScript Deep Dive',
      slug: 'typescript-deep-dive-webinar',
      dateStart: new Date('2026-03-05T17:00:00Z'),
      dateEnd: new Date('2026-03-05T19:00:00Z'),
      description: 'Kostenloses Online-Webinar zu fortgeschrittenen TypeScript-Features. Von Generics über Template Literal Types bis zu Brand Types - alles was Sie für Production-Ready Code brauchen.',
      categoryId: categories[3].id,
      userId: adminUser.id,
      published: true,
      orgaName: 'TypeScript Academy',
      orgaWebsite: 'https://typescript-academy.com',
      eventWebsite: 'https://ts-deepdive.com',
      registrationLink: 'https://ts-deepdive.com/join',
      isOnlineEvent: true,
      tags: ['TypeScript', 'JavaScript', 'Web Development', 'Programming'],
    },
    {
      name: 'Data Science Bootcamp Stuttgart',
      slug: 'data-science-bootcamp-stuttgart',
      dateStart: new Date('2026-06-01T09:00:00Z'),
      dateEnd: new Date('2026-06-05T17:00:00Z'),
      description: 'Intensive 5-tägige Schulung zu Python, Pandas, Machine Learning und Data Visualization. Von Grundlagen bis zu Production ML Pipelines.',
      categoryId: categories[1].id,
      userId: adminUser.id,
      published: true,
      orgaName: 'Data Academy Germany',
      orgaWebsite: 'https://data-academy.de',
      eventWebsite: 'https://bootcamp-stuttgart.data-academy.de',
      eventAddress: 'Startup Campus Stuttgart, Heilbronner Straße 86, 70191 Stuttgart',
      registrationLink: 'https://bootcamp-stuttgart.data-academy.de/signup',
      isOnlineEvent: false,
      tags: ['Data Science', 'Python', 'Machine Learning', 'Analytics'],
    },
    {
      name: 'Blockchain & Web3 Conference Düsseldorf',
      slug: 'blockchain-web3-conference-duesseldorf',
      dateStart: new Date('2026-07-10T09:00:00Z'),
      dateEnd: new Date('2026-07-11T18:00:00Z'),
      description: 'Entdecken Sie die Zukunft des dezentralen Internets. Smart Contracts, DeFi, NFTs und DAO-Governance. Mit Founder-Panel und Investment-Pitch-Session.',
      categoryId: categories[0].id,
      userId: adminUser.id,
      published: true,
      orgaName: 'Blockchain Hub NRW',
      orgaWebsite: 'https://blockchainhub-nrw.de',
      eventWebsite: 'https://web3conf-dus.de',
      eventAddress: 'Rheinterrasse Düsseldorf, Joseph-Beuys-Ufer 33, 40479 Düsseldorf',
      registrationLink: 'https://web3conf-dus.de/tickets',
      isOnlineEvent: false,
      tags: ['Blockchain', 'Web3', 'Cryptocurrency', 'DeFi', 'NFT'],
    },
    {
      name: 'Flutter & Dart Meetup Leipzig',
      slug: 'flutter-dart-meetup-leipzig',
      dateStart: new Date('2026-03-25T18:00:00Z'),
      dateEnd: new Date('2026-03-25T21:00:00Z'),
      description: 'Community-Treffen für Flutter-Entwickler. Diesen Monat: State Management mit Riverpod, Custom Animations und Cross-Platform Best Practices.',
      categoryId: categories[2].id,
      userId: adminUser.id,
      published: true,
      orgaName: 'Flutter Leipzig Community',
      orgaWebsite: 'https://flutter-leipzig.de',
      eventAddress: 'Basislager Coworking, Peterssteinweg 14, 04107 Leipzig',
      registrationLink: 'https://meetup.com/flutter-leipzig',
      isOnlineEvent: false,
      tags: ['Flutter', 'Dart', 'Mobile Development', 'Cross-Platform'],
    },
    {
      name: 'AI Hackathon Karlsruhe',
      slug: 'ai-hackathon-karlsruhe',
      dateStart: new Date('2026-08-21T10:00:00Z'),
      dateEnd: new Date('2026-08-23T18:00:00Z'),
      description: '48-Stunden Non-Stop Coding Challenge! Entwickeln Sie innovative KI-Lösungen für nachhaltige Mobilität. Mit Mentoren von SAP, Bosch und KIT. Preispool: 25.000€.',
      categoryId: categories[4].id,
      userId: adminUser.id,
      published: true,
      orgaName: 'Karlsruhe Innovation Hub',
      orgaWebsite: 'https://innovation-ka.de',
      eventWebsite: 'https://ai-hackathon-ka.de',
      eventAddress: 'Technologiepark Karlsruhe, Haid-und-Neu-Straße 7, 76131 Karlsruhe',
      registrationLink: 'https://ai-hackathon-ka.de/register',
      isOnlineEvent: false,
      tags: ['Hackathon', 'AI', 'Innovation', 'Coding Challenge'],
    },
    {
      name: 'DevOps Days Dresden',
      slug: 'devops-days-dresden',
      dateStart: new Date('2026-05-28T09:00:00Z'),
      dateEnd: new Date('2026-05-29T17:00:00Z'),
      description: 'Zwei Tage DevOps-Kultur, Automation und Collaboration. CI/CD, Infrastructure as Code, Monitoring und Incident Management. Open Space Format für maximalen Austausch.',
      categoryId: categories[0].id,
      userId: adminUser.id,
      published: true,
      orgaName: 'DevOps Community Dresden',
      orgaWebsite: 'https://devops-dresden.de',
      eventWebsite: 'https://devopsdays-dd.de',
      eventAddress: 'Impact Hub Dresden, Trompeterstraße 5, 01069 Dresden',
      registrationLink: 'https://devopsdays-dd.de/anmeldung',
      isOnlineEvent: false,
      tags: ['DevOps', 'CI/CD', 'Automation', 'Infrastructure'],
    },
    {
      name: 'Python Data Engineering Workshop Hannover',
      slug: 'python-data-engineering-hannover',
      dateStart: new Date('2026-04-14T09:30:00Z'),
      dateEnd: new Date('2026-04-15T16:30:00Z'),
      description: 'Hands-on Workshop zu Apache Airflow, dbt und modernen Data Pipelines. Lernen Sie, skalierbare ETL-Prozesse zu bauen und zu orchestrieren.',
      categoryId: categories[1].id,
      userId: adminUser.id,
      published: true,
      orgaName: 'Data Engineers Germany',
      orgaWebsite: 'https://dataengineers.de',
      eventWebsite: 'https://pydata-workshop-haj.de',
      eventAddress: 'ÜSTRA Remise, An der Strangriede 8, 30167 Hannover',
      registrationLink: 'https://pydata-workshop-haj.de/signup',
      isOnlineEvent: false,
      tags: ['Python', 'Data Engineering', 'ETL', 'Airflow', 'dbt'],
    },
    {
      name: 'Agile Leadership Summit Bremen',
      slug: 'agile-leadership-summit-bremen',
      dateStart: new Date('2026-09-15T09:00:00Z'),
      dateEnd: new Date('2026-09-16T17:00:00Z'),
      description: 'Konferenz für moderne Führung in agilen Organisationen. Scrum at Scale, OKRs, Remote Leadership und psychologische Sicherheit. Für CTOs, Team Leads und Agile Coaches.',
      categoryId: categories[0].id,
      userId: adminUser.id,
      published: true,
      orgaName: 'Agile Alliance Germany',
      orgaWebsite: 'https://agilealliance.de',
      eventWebsite: 'https://agilesummit-bremen.de',
      eventAddress: 'Messe Bremen, Findorffstraße 101, 28215 Bremen',
      registrationLink: 'https://agilesummit-bremen.de/tickets',
      isOnlineEvent: false,
      tags: ['Agile', 'Leadership', 'Management', 'Scrum', 'OKR'],
    },
    {
      name: 'Online: GraphQL Masterclass',
      slug: 'graphql-masterclass-online',
      dateStart: new Date('2026-06-18T16:00:00Z'),
      dateEnd: new Date('2026-06-18T20:00:00Z'),
      description: 'Vierstündiger Live-Workshop zu GraphQL Schema Design, Performance-Optimierung, Subscriptions und Federation. Inklusive Q&A mit Apollo-Entwicklern.',
      categoryId: categories[3].id,
      userId: adminUser.id,
      published: true,
      orgaName: 'GraphQL Europe',
      orgaWebsite: 'https://graphql-europe.org',
      eventWebsite: 'https://graphql-masterclass.com',
      registrationLink: 'https://graphql-masterclass.com/join',
      isOnlineEvent: true,
      tags: ['GraphQL', 'API', 'Backend', 'Apollo'],
    },
    {
      name: 'Quantum Computing Introduction Bonn',
      slug: 'quantum-computing-intro-bonn',
      dateStart: new Date('2026-10-05T14:00:00Z'),
      dateEnd: new Date('2026-10-05T18:00:00Z'),
      description: 'Halbtägiger Einführungsworkshop in Quantum Computing. Keine Physik-Vorkenntnisse nötig! Mit praktischen Übungen auf IBM Quantum Lab.',
      categoryId: categories[1].id,
      userId: adminUser.id,
      published: true,
      orgaName: 'Quantum Computing Institut',
      orgaWebsite: 'https://quantum-computing.de',
      eventAddress: 'Deutsches Museum Bonn, Ahrstraße 45, 53175 Bonn',
      registrationLink: 'https://quantum-intro-bonn.de',
      isOnlineEvent: false,
      tags: ['Quantum Computing', 'Physics', 'Future Tech', 'IBM'],
    },
    {
      name: 'Rust Programming Meetup Nürnberg',
      slug: 'rust-meetup-nuernberg',
      dateStart: new Date('2026-04-30T18:30:00Z'),
      dateEnd: new Date('2026-04-30T21:30:00Z'),
      description: 'Monatliches Community-Event für Rust-Enthusiasten. Lightning Talks zu async/await, Embedded Rust und WebAssembly. Networking bei Bratwurst und Bier.',
      categoryId: categories[2].id,
      userId: adminUser.id,
      published: true,
      orgaName: 'Rust User Group Nürnberg',
      orgaWebsite: 'https://rust-nuernberg.de',
      eventAddress: 'Z-Bau Nürnberg, Frankenstraße 200, 90461 Nürnberg',
      registrationLink: 'https://meetup.com/rust-nuernberg',
      isOnlineEvent: false,
      tags: ['Rust', 'Systems Programming', 'WebAssembly', 'Performance'],
    },
    {
      name: 'UX/UI Design Sprint Essen',
      slug: 'ux-ui-design-sprint-essen',
      dateStart: new Date('2026-07-20T10:00:00Z'),
      dateEnd: new Date('2026-07-24T16:00:00Z'),
      description: 'Fünftägiger Design Sprint nach Google Ventures Methodik. Von User Research über Prototyping bis zu User Testing. Für Product Designer und UX Professionals.',
      categoryId: categories[1].id,
      userId: adminUser.id,
      published: true,
      orgaName: 'Design Thinking Academy',
      orgaWebsite: 'https://designthinking-academy.de',
      eventWebsite: 'https://design-sprint-essen.de',
      eventAddress: 'Unperfekthaus Essen, Friedrich-Ebert-Straße 18-26, 45127 Essen',
      registrationLink: 'https://design-sprint-essen.de/anmeldung',
      isOnlineEvent: false,
      tags: ['UX Design', 'UI Design', 'Design Sprint', 'Prototyping'],
    },
    {
      name: 'Serverless Architecture Conference Dortmund',
      slug: 'serverless-conference-dortmund',
      dateStart: new Date('2026-11-10T09:00:00Z'),
      dateEnd: new Date('2026-11-11T18:00:00Z'),
      description: 'Alles rund um AWS Lambda, Azure Functions und Cloud Functions. Event-Driven Architecture, Serverless Patterns und Cost Optimization.',
      categoryId: categories[0].id,
      userId: adminUser.id,
      published: true,
      orgaName: 'Serverless Community Germany',
      orgaWebsite: 'https://serverless-germany.com',
      eventWebsite: 'https://serverlessconf-do.de',
      eventAddress: 'Dortmunder U, Leonie-Reygers-Terrasse 2, 44137 Dortmund',
      registrationLink: 'https://serverlessconf-do.de/register',
      isOnlineEvent: false,
      tags: ['Serverless', 'AWS Lambda', 'Cloud', 'Architecture'],
    },
    {
      name: 'Product Management Bootcamp Mannheim',
      slug: 'product-management-bootcamp-mannheim',
      dateStart: new Date('2026-08-03T09:00:00Z'),
      dateEnd: new Date('2026-08-07T17:00:00Z'),
      description: 'Intensive Woche zum Product Manager. Von Roadmap Planning über A/B Testing bis zu Stakeholder Management. Mit echten Product Leads aus dem Silicon Valley.',
      categoryId: categories[1].id,
      userId: adminUser.id,
      published: true,
      orgaName: 'Product School Germany',
      orgaWebsite: 'https://productschool.de',
      eventWebsite: 'https://pm-bootcamp-ma.de',
      eventAddress: 'Startup Mannheim, N7, 5-6, 68161 Mannheim',
      registrationLink: 'https://pm-bootcamp-ma.de/apply',
      isOnlineEvent: false,
      tags: ['Product Management', 'Strategy', 'Leadership', 'Roadmap'],
    },
    {
      name: 'Online: Vue.js 4 Sneak Peek',
      slug: 'vuejs-4-sneak-peek',
      dateStart: new Date('2026-12-01T17:00:00Z'),
      dateEnd: new Date('2026-12-01T19:00:00Z'),
      description: 'Exklusiver Online-Talk mit Vue.js Core Team Member über Vue 4 Features. Vapor Mode, neue Compiler-Optimierungen und Breaking Changes. Mit Live-Demo.',
      categoryId: categories[3].id,
      userId: adminUser.id,
      published: true,
      orgaName: 'Vue.js Community',
      orgaWebsite: 'https://vuejs.org',
      eventWebsite: 'https://vue4-sneak.com',
      registrationLink: 'https://vue4-sneak.com/attend',
      isOnlineEvent: true,
      tags: ['Vue.js', 'Frontend', 'JavaScript', 'Framework'],
    },
  ];

  console.log(' Erstelle Events...');
  
  for (const eventData of events) {
    await prisma.event.upsert({
      where: { slug: eventData.slug },
      update: {},
      create: eventData,
    });
  }

  console.log(`${events.length} Events erstellt`);
  console.log(' Seeding abgeschlossen!');
}

main()
  .catch((e) => {
    console.error(' Fehler beim Seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
