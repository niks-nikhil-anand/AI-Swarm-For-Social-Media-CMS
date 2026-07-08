import ProjectDetailPage from "../../../components/projects/ProjectDetailPage";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectDetailPage projectId={id} />;
}
