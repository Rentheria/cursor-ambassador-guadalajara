import CodeBlock from '@/modules/slides/components/CodeBlock';
import PromptBlock from '@/modules/slides/components/PromptBlock';
import DiagramSlide from '@/modules/slides/components/DiagramSlide';
import {
	SlideBody,
	SlideCallout,
	SlideGrid,
	SlideListItem,
	SlideTitle,
	TitleCard,
} from '@/modules/slides/components/primitives';
import { Slide } from '@/modules/slides/types';

/**
 * Skeleton deck — replace with your workshop content.
 * Keep slide 1 and the last slide as `type: 'title'` for full-viewport chrome.
 */
export const exampleDeck: Slide[] = [
	{
		id: 1,
		title: 'Welcome',
		type: 'title',
		content: (
			<TitleCard
				eyebrow={<p className="text-sm tracking-wide text-cursor-text-faint">Your community · Workshop</p>}
				title="Your workshop title"
				subtitle="One short line about what people will do today"
				footer={
					<div className="space-y-1">
						<p className="text-base text-cursor-text-secondary">Your Name</p>
						<p className="text-sm text-cursor-text-faint">Cursor Ambassador · Your City</p>
					</div>
				}
			/>
		),
	},
	{
		id: 2,
		title: 'Agenda',
		type: 'content',
		content: (
			<SlideBody>
				<SlideTitle>Agenda</SlideTitle>
				<div className="max-w-3xl space-y-4">
					<SlideListItem index={1} label="Topic one" desc="Replace with your outline" />
					<SlideListItem index={2} label="Topic two" desc="Keep each line short" />
					<SlideListItem index={3} label="Hands-on" desc="Build something together" />
				</div>
			</SlideBody>
		),
	},
	{
		id: 3,
		title: 'Callouts & grid',
		type: 'content',
		content: (
			<SlideBody>
				<SlideTitle>Callouts &amp; grid</SlideTitle>
				<SlideGrid>
					<SlideCallout variant="green">
						<p className="text-cursor-accent-green mb-2">Primary point</p>
						<p className="text-sm text-cursor-text-secondary">Use callouts for one idea each.</p>
					</SlideCallout>
					<SlideCallout variant="blue">
						<p className="text-cursor-accent-blue mb-2">Secondary point</p>
						<p className="text-sm text-cursor-text-secondary">Avoid packing the whole deck into one slide.</p>
					</SlideCallout>
				</SlideGrid>
			</SlideBody>
		),
	},
	{
		id: 4,
		title: 'Prompt pattern',
		type: 'prompt',
		content: (
			<SlideBody>
				<SlideTitle>Prompt pattern</SlideTitle>
				<PromptBlock prompt="Replace this with a prompt your attendees can copy into Cursor." />
			</SlideBody>
		),
	},
	{
		id: 5,
		title: 'Code pattern',
		type: 'code',
		content: (
			<SlideBody>
				<SlideTitle>Code pattern</SlideTitle>
				<CodeBlock
					code={`// Replace with a short snippet
export const hello = () => {
  console.log('Build your own deck')
}`}
				/>
			</SlideBody>
		),
	},
	{
		id: 6,
		title: 'Diagram',
		type: 'diagram',
		content: (
			<SlideBody>
				<SlideTitle>Diagram</SlideTitle>
				<DiagramSlide
					src="/slides/diagrams/example-flow.svg"
					alt="Example flow diagram"
					caption="Drop SVGs in public/slides/diagrams/ — text uses CursorGothic automatically."
				/>
			</SlideBody>
		),
	},
	{
		id: 7,
		title: 'Thank you',
		type: 'title',
		content: (
			<TitleCard
				eyebrow={<p className="text-sm tracking-wide text-cursor-text-faint">Your community</p>}
				title="Thank you"
				subtitle="Keep building"
				footer={
					<div className="space-y-1">
						<p className="text-base text-cursor-text-secondary">yourcommunity.example</p>
						<p className="text-sm text-cursor-text-faint">Link your Luma / Discord / site here</p>
					</div>
				}
			/>
		),
	},
];

export const totalExampleSlides = exampleDeck.length;
