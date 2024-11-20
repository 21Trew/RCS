import React, { useMemo } from 'react';

import './Chart.css';
import { ChartData, InstanceData } from '../types/data';
import Legend from "./Legend";

interface ChartProps {
	data: ChartData;
}

type InstanceType = 'dev' | 'test' | 'prod' | 'norm';

const Chart: React.FC<ChartProps> = ({ data }) => {
	const allValuesZero = useMemo(() => {
		if (!data) return true; // Если данных нет, то считаем, что все значения равны нулю
		return (
			Object.values(data.dev || {}).every((v) => v === 0) &&
			Object.values(data.test || {}).every((v) => v === 0) &&
			Object.values(data.prod || {}).every((v) => v === 0) &&
			data.norm === 0
		);
	}, [data]);
	
	const canvasHeight = 350;
	
	const maxValue = useMemo(() => {
		const values = [
			...Object.values(data.dev),
			...Object.values(data.test),
			...Object.values(data.prod),
			data.norm
		];
		return Math.max(...values);
	}, [data]);
	
	const calculateSum = (instance: InstanceType): number =>
		instance === 'norm'
			? data.norm
			: Object.values(data[instance]).reduce((acc, curr) => acc + curr, 0)
	;
	
	{/* Узнаем высоту каждого сегмента столбика - front, back, db */}
	const getSegmentHeight = (value: number) => {
		const maxSegmentHeight = 120; // максимальная высота в пикселях
		const minSegmentHeight = 20;
		const scale = (maxSegmentHeight - minSegmentHeight) / maxValue; // коэффициент масштабирования
		return Math.min(value * scale + minSegmentHeight, maxSegmentHeight); // ограничиваем высоту до 100px
	};
	
	{/* Узнаем высоту каждого столбика - dev, test, prod */}
	const getBarHeight = (instanceData: InstanceData | number) => {
		if (typeof instanceData === 'number') {
			const maxHeight = 150; // максимальная высота для norm
			const minHeight = 0;
			const scale = (maxHeight - minHeight) / maxValue;
			return Math.min(instanceData * scale + minHeight,  maxHeight);
		}
		const frontHeight = getSegmentHeight(instanceData.front);
		const backHeight = getSegmentHeight(instanceData.back);
		const dbHeight = getSegmentHeight(instanceData.db);
		return frontHeight + backHeight + dbHeight;
	};
	
	const renderBars = (instance: InstanceType, index: number) => {
		const barWidth = 80;
		const gapWidth = 60;
		const x = index * (barWidth + gapWidth);
		const cornerRadius = 5;
		
		if (instance === 'norm') {
			const normHeight = getBarHeight(data.norm);
			return (
				<g key={instance} transform={`translate(${x}, ${canvasHeight})`}>
					<rect
						className="bar norm"
						y={-normHeight}
						height={normHeight}
						width={barWidth}
						fill="url(#diagonalHatch)"
						rx={cornerRadius}
						ry={cornerRadius}
					/>
					<rect
						className="bar norm"
						y={-normHeight}
						height={normHeight}
						width={barWidth}
						fill="#FFFFFF"
						fillOpacity="0"
						rx={cornerRadius}
						ry={cornerRadius}
					/>
					{/* Добавляем белый прямоугольник как фон для значения */}
					<rect
						x={(barWidth - 48) / 2}
						y={-normHeight / 2 - 12}
						width="48"
						height="24"
						rx={cornerRadius}
						fill="white"
					/>
					{/* Добавляем текст со значением норматива */}
					{data.norm > 0 && <text
              x={barWidth / 2}
              y={-normHeight / 2 + 5}
              textAnchor="middle"
              className="norm-bar-text"
          >
						{data.norm}
          </text>}
					
					<text x={barWidth / 2} y={20} textAnchor="middle" className="bar-label">
						{instance === 'norm' ? 'норматив' : instance}
					</text>
				</g>
			);
		}
		
		const instanceData = data[instance] as InstanceData;
		const totalHeight = getBarHeight(instanceData);
		
		return (
			<g key={instance} transform={`translate(${x}, ${canvasHeight})`}>
				{/* db (нижний сегмент) */}
				<path
					className="bar db"
					d={`
						M 0 ${-getSegmentHeight(instanceData.db)}
						H ${barWidth}
						V 0
						Q ${barWidth} 5  ${barWidth - 5} 5
						H 5
						Q 0 5 0 0
						Z
					`}
				/>
				{instanceData.db > 0 && <text
            x={barWidth / 2}
            y={-getSegmentHeight(instanceData.db) + getSegmentHeight(instanceData.db) / 2}
            textAnchor="middle"
            className="bar-text"
        >
					{instanceData.db}
        </text>}
				
				{/* back (средний сегмент) */}
				<rect
					className="bar back"
					y={-getSegmentHeight(instanceData.db) - getSegmentHeight(instanceData.back)}
					height={getSegmentHeight(instanceData.back)}
					width={barWidth}
				/>
				{instanceData.back > 0 && <text
            x={barWidth / 2}
            y={-getSegmentHeight(instanceData.db) - getSegmentHeight(instanceData.back) + getSegmentHeight(instanceData.back) / 2}
            textAnchor="middle"
            className="bar-text"
        >
					{instanceData.back}
        </text>}
				
				{/* front (верхний сегмент) */}
				<path
					className="bar front"
					d={`
							M 0 ${-totalHeight + 5}
							Q 0 ${-totalHeight} 5 ${-totalHeight}
							H ${barWidth - 5}
							Q ${barWidth} ${-totalHeight} ${barWidth} ${-totalHeight + 5}
							V ${-totalHeight + getSegmentHeight(instanceData.front)}
							H 5
							Q 0 ${-totalHeight + getSegmentHeight(instanceData.front)} 0 ${-totalHeight + getSegmentHeight(instanceData.front)}
							V ${-totalHeight}
							Z
					`}
				/>
				{instanceData.front > 0 && <text
            x={barWidth / 2}
            y={-totalHeight + getSegmentHeight(instanceData.front) / 2}
            textAnchor="middle"
            className="bar-text"
        >
					{instanceData.front}
        </text>}
				
				<text x={barWidth / 2} y={20} textAnchor="middle" className="bar-label">
					{instance}
				</text>
			</g>
		);
	};
	
	const renderArrows = () => {
		const devSum = calculateSum('dev');
		const testSum = calculateSum('test');
		const prodSum = calculateSum('prod');
		const deltaDevTest = testSum - devSum;
		const deltaTestProd = prodSum - testSum;
		
		const gapHeight = 20;
		const barWidth = 80;
		const halfBarWidth = barWidth / 2;
		const gapWidth = 60;
		const devMiddleX = halfBarWidth;
		const testMiddleX = barWidth * 2;
		const prodMiddleX = (barWidth + gapWidth) * 2 + halfBarWidth;
		
		const devBarHeight = getBarHeight(data.dev);
		const testBarHeight = getBarHeight(data.test);
		const prodBarHeight = getBarHeight(data.prod);
		
		const renderDeltaText = (delta: number) => {
			let backgroundColor;
			let displayText;
			let arrowPath = null;
			
			if (delta > 0) {
				backgroundColor = "#00CC99";
				displayText = `+${delta}`;
				arrowPath = createArrow("up");
			} else if (delta < 0) {
				backgroundColor = "#FC440F";
				displayText = `${delta}`;
				arrowPath = createArrow("down");
			} else {
				backgroundColor = "#898290";
				displayText = `${delta}`;
			}
			// Функция для динамического определения ширины
			const calculateWidth = (text: string) => {
				// Базовая ширина 48, добавляем дополнительную ширину в зависимости от длины текста
				const baseWidth = 48;
				const additionalWidthPerChar = 8; // Примерная ширина символа
				return Math.max(baseWidth, baseWidth + (text.length - 3) * additionalWidthPerChar);
			};
			const deltaWidth = calculateWidth(displayText);
			
			return { backgroundColor, displayText, arrowPath, deltaWidth };
		};
		
		const {
			backgroundColor: devTestBgColor,
			displayText: devTestDisplayText,
			arrowPath: devTestArrow,
			deltaWidth: devTestDeltaWidth
		} = renderDeltaText(deltaDevTest);
		const {
			backgroundColor: testProdBgColor,
			displayText: testProdDisplayText,
			arrowPath: testProdArrow,
			deltaWidth: testProdDeltaWidth
		} = renderDeltaText(deltaTestProd);
		
		return (
			<g>
				{/* dev -> test */}
				<path
					d={`
            M${devMiddleX} ${canvasHeight - devBarHeight - gapHeight}
            L${devMiddleX} 0
            H${testMiddleX}
            L${testMiddleX} 0
          	L${testMiddleX} ${canvasHeight - testBarHeight - gapHeight}
          `}
					fill="none"
					stroke="#898290"
					strokeWidth="2"
					markerEnd="url(#arrow)"
				/>
				<g>
					<rect
						x={(devMiddleX + testMiddleX - devTestDeltaWidth) / 2}
						y={-10}
						width={devTestDeltaWidth}
						height="24"
						rx="12"
						fill={devTestBgColor}
					/>
					
					<g transform={`translate(${(devMiddleX + testMiddleX - devTestDeltaWidth) / 2 + 2}, -4)`}>
						{devTestArrow}
					</g>
					
					<text
						x={(devMiddleX + testMiddleX) / 2}
						dominantBaseline="central"
						textAnchor="middle"
						fill="#FFFFFF"
					>
						{devTestDisplayText}
					</text>
				</g>
				{/* test -> prod */}
				<path
					d={`
            M${testMiddleX + halfBarWidth} ${canvasHeight - testBarHeight - gapHeight}
            L${testMiddleX + halfBarWidth} 0
            H${prodMiddleX}
            L${prodMiddleX} 0
            L${prodMiddleX} ${canvasHeight - prodBarHeight - gapHeight}
          `}
					fill="none"
					stroke="#898290"
					strokeWidth="2"
					markerEnd="url(#arrow)"
				/>
				<g>
					<rect
						x={(prodMiddleX + testMiddleX + halfBarWidth - testProdDeltaWidth) / 2}
						y={-10}
						width={testProdDeltaWidth}
						height="24"
						rx="12"
						fill={testProdBgColor}
					/>
					
					<g transform={`translate(${(prodMiddleX + testMiddleX + halfBarWidth - testProdDeltaWidth) / 2 + 2}, -4)`}>
						{testProdArrow}
					</g>
					
					<text
						x={(prodMiddleX + testMiddleX + halfBarWidth) / 2}
						dominantBaseline="central"
						textAnchor="middle"
						fill="#FFFFFF"
					>
						{testProdDisplayText}
					</text>
				</g>
			</g>
		);
	};
	
	// Функция для создания стрелок дельты
	const createArrow = (direction: "up" | "down") => {
		return (
			<svg width="8" height="10" viewBox="0 0 8 10">
				<path
					d={
						direction === "up"
							? "M3.99753 4.76701e-08L3.90761 4.65978e-08C3.81171 0.00457864 3.7172 0.0248461 3.62784 0.0599995C3.55932 0.0867377 3.49529 0.123837 3.438 0.17C3.3924 0.196522 3.34896 0.226616 3.30811 0.26L0.310604 3.12C0.215475 3.21061 0.139109 3.31909 0.0858683 3.43924C0.0326273 3.55939 0.00355357 3.68886 0.00030622 3.82025C-0.0062521 4.08562 0.0927854 4.34272 0.275633 4.535C0.45848 4.72728 0.710158 4.83899 0.975302 4.84556C1.24044 4.85212 1.49733 4.753 1.68946 4.57L2.99837 3.34L2.99837 9C2.99837 9.26522 3.10364 9.51957 3.29102 9.70711C3.4784 9.89464 3.73254 10 3.99753 10C4.26253 10 4.51667 9.89464 4.70405 9.70711C4.89143 9.51957 4.9967 9.26522 4.9967 9L4.9967 3.41L6.28563 4.71C6.37851 4.80373 6.48902 4.87812 6.61078 4.92889C6.73254 4.97966 6.86314 5.0058 6.99504 5.0058C7.12694 5.0058 7.25754 4.97966 7.3793 4.92889C7.50105 4.87812 7.61156 4.80373 7.70445 4.71C7.7981 4.61704 7.87243 4.50644 7.92316 4.38458C7.97388 4.26272 8 4.13201 8 4C8 3.86799 7.97388 3.73728 7.92316 3.61542C7.87243 3.49356 7.7981 3.38296 7.70445 3.29L4.70694 0.290001C4.61487 0.20005 4.5063 0.128743 4.38721 0.08C4.26399 0.027463 4.13147 0.000257541 3.99753 4.76701e-08Z"
							: "M4.00247 10L4.09239 10C4.18829 9.99542 4.2828 9.97515 4.37216 9.94C4.44068 9.91326 4.50471 9.87616 4.562 9.83C4.6076 9.80348 4.65104 9.77338 4.69189 9.74L7.6894 6.88C7.78452 6.78939 7.86089 6.68091 7.91413 6.56076C7.96737 6.44061 7.99645 6.31114 7.99969 6.17975C8.00625 5.91438 7.90721 5.65728 7.72437 5.465C7.54152 5.27272 7.28984 5.16101 7.0247 5.15444C6.75955 5.14788 6.50267 5.247 6.31054 5.43L5.00163 6.66L5.00163 1C5.00163 0.734783 4.89636 0.48043 4.70898 0.292893C4.5216 0.105357 4.26746 -1.63154e-07 4.00247 -1.74738e-07C3.73747 -1.86321e-07 3.48333 0.105357 3.29595 0.292893C3.10857 0.48043 3.0033 0.734783 3.0033 1L3.0033 6.59L1.71437 5.29C1.62149 5.19627 1.51098 5.12188 1.38922 5.07111C1.26746 5.02034 1.13686 4.9942 1.00496 4.9942C0.873059 4.9942 0.742462 5.02034 0.620704 5.07111C0.498946 5.12188 0.388438 5.19627 0.295552 5.29C0.201901 5.38296 0.127569 5.49356 0.0768425 5.61542C0.0261161 5.73728 2.20339e-07 5.86799 2.14569e-07 6C2.08798e-07 6.13201 0.0261161 6.26272 0.0768425 6.38458C0.127569 6.50644 0.201901 6.61704 0.295552 6.71L3.29306 9.71C3.38513 9.79995 3.4937 9.87126 3.61279 9.92C3.73601 9.97254 3.86853 9.99974 4.00247 10Z"
					}
					fill="#fff"
				/>
			</svg>
		);
	};
	
	return (
		<section className="chart">
			<svg width="600" height="450">
				<defs>
					{/*стрелка*/}
					<marker id="arrow" markerWidth="7" markerHeight="4" refX="3.5" refY="3">
						<path
							d="M3.02471 2.3672H3.97529L6.18863 0.140074C6.37424 -0.0466915 6.67518 -0.0466915 6.86079 0.140074C7.0464 0.32684 7.0464 0.629646 6.86079 0.816412L3.83608 3.85993C3.65047 4.04669 3.34953 4.04669 3.16392 3.85993L0.139209 0.816412C-0.0464029 0.629646 -0.0464029 0.32684 0.139209 0.140074C0.32482 -0.0466915 0.625755 -0.0466915 0.811367 0.140074L3.02471 2.3672Z"
							fill="#898290"
						/>
					</marker>
					{/*диагональная отрисовка норматива*/}
					<pattern id="diagonalHatch" patternUnits="userSpaceOnUse" width="15" height="10"
									 patternTransform="rotate(45 0 0)">
						<line x1="0" y1="0" x2="0" y2="10" stroke="#4AB6E8" strokeWidth="20"/>
					</pattern>
				</defs>
				
				{allValuesZero ? (
					<text x="300" y="250" textAnchor="middle">Нет данных</text>
				) : (
					<g transform="translate(50, 50)">
						{['dev', 'test', 'prod', 'norm'].map((instance, index) => (
							<g key={instance}>
								{renderBars(instance as InstanceType, index)}
							</g>
						))}
						{renderArrows()}
					</g>)}
			</svg>
			
			<Legend/>
		</section>
	);
}

export default Chart;