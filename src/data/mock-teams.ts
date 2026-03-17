export type TeamMember = { name: string; email: string }
export type Team = { team_name: string; members: TeamMember[] }

export const MOCK_TEAMS: Team[] = [
  {
    team_name: "Team Darshan",
    members: [
      { name: "Darshan Singh", email: "Darshan.Singh@vizvainc.com" },
      { name: "Vaibhav Kaushik", email: "vaibhav.kaushik@vizvainc.com" },
      { name: "Harshit", email: "harshit@vizvainc.com" },
      { name: "Shubhankar Saha", email: "shubhankar.saha@vizvainc.com" },
      { name: "Ainadri Mandal", email: "Ainadri.mandal@vizvainc.com" },
      { name: "Subhash Sharma", email: "Subhash.sharma@vizvainc.com" },
      { name: "Meghna Mondal", email: "Meghna.mondal@vizvainc.com" },
    ],
  },
  {
    team_name: "Team Anushree",
    members: [
      { name: "Ajay Krishna", email: "ajay.krishna@vizvainc.com" },
      { name: "Shraavana", email: "shraavana@silverspaceinc.com" },
      { name: "Anusree Vasudevan", email: "anusree.vasudevan@vizvainc.com" },
      { name: "Hridhya KK", email: "Hridhya.KK@silverspaceinc.com" },
      { name: "Utsa Maiti", email: "utsa.maiti@vizvainc.com" },
      { name: "Saikat Bera", email: "Saikat.Bera@vizvainc.com" },
      { name: "Ritwik Ghosh", email: "ritwik.ghosh@vizvainc.com" },
    ],
  },
  {
    team_name: "Team Prateek",
    members: [
      { name: "Aakash Sharma", email: "Aakash.sharma@vizvainc.com" },
      { name: "Varsha Sahu", email: "varsha.sahu@vizvainc.com" },
      { name: "Prateek Narvariya", email: "Prateek.Narvariya@silverspaceinc.com" },
      { name: "Priyanshu Jana", email: "priyanshu.jana@vizvainc.com" },
      { name: "Abhirup Kumar", email: "Abhirup.kumar@vizvainc.com" },
      { name: "Eklavya Prasad", email: "Eklavya.prasad@vizvainc.com" },
    ],
  },
  {
    team_name: "Team Rujuwal",
    members: [
      { name: "Rahul Agarwal", email: "rahul.agarwal@vizvainc.com" },
      { name: "Aditya Sharma", email: "aditya.sharma@vizvainc.com" },
      { name: "Amartya Kumar", email: "amartya.kumar@vizvainc.com" },
      { name: "Aman Agnihotri", email: "aman.agnihotri@vizvainc.com" },
      { name: "Rujuwal Garg", email: "Rujuwal.Garg@silverspaceinc.com" },
    ],
  },
  {
    team_name: "Team Bhavya",
    members: [
      { name: "Bhavya Dutt", email: "Bhavya.Dutt@vizvainc.com" },
      { name: "Ravikant Raj", email: "ravikant.raj@silverspaceinc.com" },
      { name: "Satyam Singh", email: "satyam.singh@silverspaceinc.com" },
      { name: "Patel Vidhi", email: "Patel.vidhi@silverspaceinc.com" },
      { name: "Sonali Das", email: "sonali.das@silverspaceinc.com" },
      { name: "Shailesh Kumar", email: "shailesh.kumar@silverspaceinc.com" },
      { name: "Aaliya Khurshid", email: "Aaliya.Khurshid@silverspaceinc.com" },
      { name: "Aritra Bose", email: "Aritra.Bose@vizvainc.com" },
      { name: "Tushar Mandal", email: "Tushar.Mandal@vizvainc.com" },
      { name: "Astha Singh", email: "astha.singh@silverspaceinc.com" },
      { name: "Sandhya", email: "Sandhya@silverspaceinc.com" },
    ],
  },
  {
    team_name: "Team Nikesh",
    members: [
      { name: "Jayesh Nalawade", email: "jayesh.nalawade@silverspaceinc.com" },
      { name: "Nikesh Raj", email: "Nikesh.Raj@silverspaceinc.com" },
      { name: "Hari Singh", email: "hari.singh@silverspaceinc.com" },
    ],
  },
]

function normalizeEmail(v: string) {
  const s = (v || "").trim()
  return s && s.includes("@") ? s.toLowerCase() : ""
}

export function getMockTeamsByEmail(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const t of MOCK_TEAMS) {
    for (const m of t.members) {
      const em = normalizeEmail(m.email)
      if (em) map[em] = t.team_name
    }
  }
  return map
}

export function getMockMembersForTeam(teamName: string) {
  return MOCK_TEAMS.find((t) => t.team_name === teamName)?.members ?? []
}

export function getMockEmailsForTeam(teamName: string) {
  const members = getMockMembersForTeam(teamName)
  const emails = members.map((m) => normalizeEmail(m.email)).filter(Boolean)
  return Array.from(new Set(emails))
}

export function getMockTeamNames() {
  return MOCK_TEAMS.map((t) => t.team_name)
}
