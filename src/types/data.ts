// types/data.ts
export interface InstanceData {
	front: number;
	back: number;
	db: number;
}

export interface ChartData {
	key: string;
	title: string;
	dev: InstanceData;
	test: InstanceData;
	prod: InstanceData;
	norm: number;
}