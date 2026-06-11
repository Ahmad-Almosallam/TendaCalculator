// Verbatim real order paste (tab-separated, two-line products with "- Talla-Peso" variant rows).
// Note: the source data itself is inconsistent by 1 cent (items sum to 1,324.56€ vs Sub-Total
// 1,324.55€) — the parser is expected to surface that as a warning, not to fix it.
export const realOrder = `Product Name	Model	Quantity	Price	Total
Asics Solution Speed FF 4 Clay Black Green Sneakers
  - Talla-Peso: -44	23527	1	92.56€	92.56€
Short Endless Phoenix Negro Azul
  - Talla-Peso: -L	18754	1	21.49€	21.49€
Short Endless Storm II Gris
  - Talla-Peso: -L	25946	1	28.93€	28.93€
Head Basic Boxers Grey Red 2 Units
  - Talla-Peso: -L	19036	1	7.02€	7.02€
Bullpadel BPG252 I Stone Cap	200499	1	9.09€	9.09€
Bullpadel BPG252 Black Cap	185867	1	8.68€	8.68€
Bullpadel BPG243 Cap White	169220	1	8.26€	8.26€
Boxers Head Basic Gris Combo
  - Talla-Peso: -L	19044	1	7.02€	7.02€
Head Performance Padel Crew Blue Aqua Socks 1 Pair
  - Talla-Peso: -39-42	20649	1	6.20€	6.20€
Calcetines Adidas Performance Climacool Crew Negro 3 Pares
  - Talla-Peso: -40-42	23363	1	11.57€	11.57€
Black Crown Premium High Black Socks 1 Pair
  - Talla-Peso: -39-42	20990	1	3.72€	3.72€
Bullpadel Monda Clay T-shirt
  - Talla-Peso: -L	22007	1	19.01€	19.01€
Short Bullpadel Clay Pot
  - Talla-Peso: -L	21868	1	26.45€	26.45€
Floky Agustin Tapia No Strain Black Arm Warmers 1 Unit
  - Talla-Peso: -M-L	23096	1	21.49€	21.49€
Floky No Strain Evolution White Arm Warmers 1 Unit
  - Talla-Peso: -M-L	26170	1	14.88€	14.88€
Puma Momo Gonzalez Nova Elite Blue Orange Sneakers
  - Talla-Peso: -44,5	24363	1	69.42€	69.42€
Lok Yanguas Maxx Hype Racket
  - Talla-Peso: -351-375	18623	3	111.57€	334.71€
Camiseta Wilson Bela Seamless Crew Blanco
  - Talla-Peso: -M	16346	1	15.70€	15.70€
Camiseta Wilson Bela Seamless Crew Negro
  - Talla-Peso: -M	16338	1	23.97€	23.97€
Polo Wilson Bela Seamless Rojo
  - Talla-Peso: -M	16351	1	23.97€	23.97€
Polo Wilson Bela Seamless Blanco
  - Talla-Peso: -M	16352	1	28.93€	28.93€
Wilson All Day Navy Blue Women''''s T-Shirt
  - Talla-Peso: -M	23581	1	27.27€	27.27€
Overgrips Adidas Tacky Feeling White 3 Units	08962	2	4.96€	9.92€
Adidas Freelift Turquoise T-Shirt
  - Talla-Peso: -M	25592	1	34.71€	34.71€
Bote de 3 Pelotas Adidas Speed RX World Cup 2026	204268	2	4.96€	9.92€
Pack of 3 Adidas Speed RX Ball Boats	121859	2	10.74€	21.49€
Wilson Pro Box White 60 Overgrips	156279	2	68.18€	136.36€
Blister Bullpadel 3 Overgrips GB1603 Senso White	06186	1	5.54€	5.54€
Blister Bullpadel 3 Overgrips GB1603 Comfort White	07876	1	4.55€	4.55€
Adidas Crazyquick Boost Padel White Blue Sneakers
  - Talla-Peso: -43 1/3	25565	1	92.56€	92.56€
Adidas Crazyquick Boost Padel White Blue Sneakers
  - Talla-Peso: -41 1/3	25565	1	92.56€	92.56€
Pala Bullpadel Delfi Brea Vertex 04 Pro Line W 2025
  - Talla-Peso: -341-365	21025	1	106.61€	106.61€
Sub-Total	1,324.55€
Saudi Arabia Shipping (Weight: 1.50kg)	59.00€
Additional charge for paddle racket volume	10.00€
Additional per Shoes Volume	29.00€
Total	1,422.55€`;

// Fully self-consistent synthetic order: items sum to Sub-Total, Sub-Total + fees = Total.
// Parsing this must produce ZERO warnings.
export const consistentOrder = `Product Name	Model	Quantity	Price	Total
Test Racket Pro
  - Talla-Peso: -350	11111	2	100.00€	200.00€
Test Cap Classic	22222	1	10.00€	10.00€
Test Padel Shoes
  - Talla-Peso: -42	33333	1	50.00€	50.00€
Sub-Total	260.00€
Saudi Arabia Shipping (Weight: 2.00kg)	40.00€
Total	300.00€`;
