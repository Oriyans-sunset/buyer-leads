import AuthWrapper from "@/app/components/AuthWrapper";

export default function BuyersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthWrapper>{children}</AuthWrapper>;
}
