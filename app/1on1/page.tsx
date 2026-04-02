"use client"

import * as React from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { VintageDashboard } from "@/components/1on1/vintage-dashboard"
import { VintageForm } from "@/components/1on1/vintage-form"

export default function OneOnOnePage() {
  const [view, setView] = React.useState<"dashboard" | "form">("dashboard")
  const [editingReview, setEditingReview] = React.useState<any | null>(null)
  
  const [reviews, setReviews] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchReviews = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/1on1/monthlykpi/reviews")
      if (!res.ok) throw new Error("Failed to fetch reviews")
      const data = await res.json()
      setReviews(data.reviews || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const handleSave = async (data: any) => {
    const payload = { ...data }
    const res = await fetch("/api/1on1/monthlykpi/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "Failed to save")
    }
    
    await fetchReviews()
    setView("dashboard")
  }

  const goNew = (empData: any = null) => {
    setEditingReview(empData)
    setView("form")
  }

  const goEdit = (r: any) => {
    setEditingReview(r)
    setView("form")
  }

  const goBack = () => {
    setView("dashboard")
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-[1920px] mx-auto pb-12">
         {view === "dashboard" ? (
           <VintageDashboard 
             onNew={goNew} 
             onEdit={goEdit} 
             reviews={reviews} 
             fetchReviews={fetchReviews} 
             loading={loading} 
           />
         ) : (
           <VintageForm 
             initialData={editingReview} 
             onBack={goBack} 
             onSave={handleSave} 
           />
         )}
      </div>
    </DashboardLayout>
  )
}
