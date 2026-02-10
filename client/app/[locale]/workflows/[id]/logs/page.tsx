export default async function Logs({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <>Logs of workflow {id}</>
    </>
  );
}
