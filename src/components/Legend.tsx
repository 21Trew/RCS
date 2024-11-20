import React from 'react';
import './Legend.css';

interface LegendItemProps {
	color: string;
	text: string;
}

const LegendItem = ({ color, text }: LegendItemProps) => (
	<div className="legend-item">
		<svg width="16" height="16">
			<rect x="0" y="0" width="16" height="16" fill={color} rx="3" ry="3"/>
		</svg>
		<div className="legend-text">{text}</div>
	</div>
);

const Legend = () => (
	<div className="legend">
		<LegendItem color="#4AB6E8" text="Клиентская часть" />
		<LegendItem color="#AA6FAC" text="Серверная часть" />
		<LegendItem color="#E85498" text="База данных" />
	</div>
);

export default Legend;