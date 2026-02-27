import { getMongoClient } from "@/lib/mongodb"

export const runtime = "nodejs"

// Helper function to extract name from email
function extractNameFromEmail(email: string): string {
  if (!email || !email.includes("@")) return email
  const [localPart] = email.split("@")
  // Handle dots and other separators
  return localPart
    .split(/[._-]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "20", 10)
    const skip = (page - 1) * limit

    const mainExpertFilter = searchParams.get("mainExpert")
    const taggedExpertFilter = searchParams.get("taggedExpert")
    const year = searchParams.get("year")
    const month = searchParams.get("month")

    const mongoClient = await getMongoClient()
    const db = mongoClient.db("interviewSupport")
    const collection = db.collection("taskBody")
    const usersCollection = db.collection("users")

    // 1. Base Match: Must have replies
    const initialMatch: any = {
      replies: { $exists: true, $not: { $size: 0 } },
    }
    
    // Apply Date Filter if provided
    if (year || month) {
      initialMatch["Date of Interview"] = {}
      if (year && month) {
        const regex = new RegExp(`^${month}/\\d{2}/${year}`)
        initialMatch["Date of Interview"] = { $regex: regex }
      } else if (year) {
        const regex = new RegExp(`^\\d{2}/\\d{2}/${year}`)
        initialMatch["Date of Interview"] = { $regex: regex }
      }
    }

    if (mainExpertFilter && mainExpertFilter !== "all") {
      initialMatch.assignedTo = mainExpertFilter
    }

    const pipeline: any[] = [
      { $match: initialMatch },

      // 2. Identify Main Expert and Tagged Experts
      {
        $addFields: {
          mainExpertEmail: "$assignedTo",
          
          // Extract emails from "Tag: @Name [email]" pattern in reply bodies
          taggedEmails: {
            $reduce: {
              input: "$replies",
              initialValue: [],
              in: {
                $concatArrays: [
                  "$$value",
                  {
                    $map: {
                      input: {
                        $regexFindAll: {
                          input: "$$this.body",
                          regex: /Tag:\s*@[^\[]+\[([^\]]+)\]/i
                        }
                      },
                      as: "match",
                      in: { $arrayElemAt: ["$$match.captures", 0] }
                    }
                  }
                ]
              }
            }
          }
        }
      },
      
      // 3. Filter Tagged Experts: exclude duplicates, nulls, empty strings
      {
        $addFields: {
          taggedEmails: {
            $setDifference: [
              {
                $filter: {
                  input: "$taggedEmails",
                  as: "email",
                  cond: { 
                    $and: [
                      { $ne: ["$$email", null] },
                      { $ne: ["$$email", ""] }
                    ]
                  }
                }
              },
              [] 
            ]
          }
        }
      },

      // 4. Must have at least one tagged expert
      { $match: { "taggedEmails.0": { $exists: true } } }
    ]

    // 5. Apply Tagged Expert Filter if requested
    if (taggedExpertFilter && taggedExpertFilter !== "all") {
      pipeline.push({ $match: { taggedEmails: taggedExpertFilter } })
    }

    // 6. Pagination Facet
    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $sort: { "Date of Interview": -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              subject: 1,
              "Date of Interview": 1,
              "Start Time Of Interview": 1,
              mainExpertEmail: 1,
              taggedEmails: 1
            }
          }
        ]
      }
    })

    const result = await collection.aggregate(pipeline).toArray()
    
    const totalCount = result[0].metadata[0]?.total || 0
    let interviews = result[0].data

    // 7. Resolve Names from Users Collection
    // Collect all unique emails (lowercase for robust matching)
    const allEmails = new Set<string>()
    interviews.forEach((i: any) => {
      if (i.mainExpertEmail) allEmails.add(i.mainExpertEmail.toLowerCase())
      if (i.taggedEmails) i.taggedEmails.forEach((e: string) => allEmails.add(e.toLowerCase()))
    })

    // Fetch all users to create a robust map (assuming user count is manageable, typically < 1000)
    // If user count is huge, we should use $in with regex or collation, but here we can just fetch all or filter by $in with logic
    // Let's stick to $in but handle case insensitivity by fetching users whose email matches any of the target emails
    // A simpler way is to fetch all users if the collection is small, or use regex for each.
    // Given standard enterprise apps, fetching users by email list is standard. 
    // To be safe with casing, let's just fetch all users for now if we assume < 1000 users.
    // Or better, use a regex $in query.
    
    const emailRegexes = Array.from(allEmails).map(email => new RegExp(`^${email}$`, 'i'))
    const users = await usersCollection.find({ email: { $in: emailRegexes } }).toArray()
    
    const emailToNameMap = new Map<string, string>()
    users.forEach((u: any) => {
      if (u.email && u.name) {
        emailToNameMap.set(u.email.toLowerCase(), u.name)
      }
    })

    // Map emails to names in the result
    interviews = interviews.map((i: any) => {
      const mainEmailLower = i.mainExpertEmail?.toLowerCase()
      const mainName = emailToNameMap.get(mainEmailLower) || extractNameFromEmail(i.mainExpertEmail)

      const taggedNames = i.taggedEmails.map((e: string) => {
        const eLower = e.toLowerCase()
        return emailToNameMap.get(eLower) || extractNameFromEmail(e)
      })

      return {
        ...i,
        mainExpert: mainName,
        taggedExperts: taggedNames
      }
    })

    return Response.json({
      interviews,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    })

  } catch (error) {
    console.error("Tags API Error:", error)
    return Response.json({ error: "Failed to fetch tagged interviews" }, { status: 500 })
  }
}
