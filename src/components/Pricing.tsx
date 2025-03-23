
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

export function Pricing() {
  const plans = [
    {
      name: "Free",
      price: "0",
      description: "Perfect for trying out ClipFarm",
      features: [
        "3 video conversions per month",
        "720p video quality",
        "Basic captions",
        "Standard editing tools",
        "Export to YouTube & TikTok"
      ],
      highlighted: false,
      buttonText: "Start Free",
      buttonVariant: "outline" as const
    },
    {
      name: "Pro",
      price: "29",
      period: "month",
      description: "For content creators & influencers",
      features: [
        "50 video conversions per month",
        "1080p video quality",
        "Advanced caption styles",
        "AI-driven content detection",
        "Priority processing",
        "Export to all platforms",
        "Basic analytics"
      ],
      highlighted: true,
      buttonText: "Get Started",
      buttonVariant: "default" as const
    },
    {
      name: "Business",
      price: "79",
      period: "month",
      description: "For teams & professional creators",
      features: [
        "Unlimited video conversions",
        "4K video quality",
        "Premium caption styles & effects",
        "Advanced AI editing features",
        "Team collaboration tools",
        "White-label exports",
        "Comprehensive analytics",
        "Dedicated support"
      ],
      highlighted: false,
      buttonText: "Contact Sales",
      buttonVariant: "outline" as const
    }
  ];

  return (
    <section id="pricing" className="py-24">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Simple, Transparent Pricing</h2>
          <p className="text-xl text-gray-600">
            Choose the plan that's right for your content creation needs.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index}
              className={`relative overflow-hidden ${
                plan.highlighted 
                  ? 'border-purple-400 shadow-xl shadow-purple-100' 
                  : 'border-gray-200 shadow-md'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-blue-500 text-white text-center text-sm font-medium py-1">
                  Most Popular
                </div>
              )}
              <CardHeader className={plan.highlighted ? 'pt-10' : ''}>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  {plan.period && <span className="text-gray-500">/{plan.period}</span>}
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  variant={plan.buttonVariant} 
                  className={`w-full ${
                    plan.highlighted 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white border-0' 
                      : ''
                  }`}
                >
                  {plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
