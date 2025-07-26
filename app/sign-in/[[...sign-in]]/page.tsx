import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <SignIn
        appearance={{
          elements: {
            formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
            card: "bg-white border border-gray-200 shadow-lg",
            headerTitle: "text-gray-900",
            headerSubtitle: "text-gray-600",
            formFieldLabel: "text-gray-700",
            formFieldInput: "bg-white border-gray-300 text-gray-900",
            footerActionLink: "text-blue-600 hover:text-blue-700",
            socialButtonsBlockButton: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
          },
        }}
      />
    </div>
  )
}
