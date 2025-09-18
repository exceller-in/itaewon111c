import { useState, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Upload, Minus, Plus, RotateCcw, Download, Shuffle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Participant, Prize, Winner } from '@/types';

const Index = () => {
  // 초기 샘플 데이터 생성
  const createSampleData = (): Participant[] => {
    return Array.from({ length: 50 }, (_, i) => ({
      number: (i + 1).toString().padStart(3, '0'),
      isWinner: false,
    }));
  };

  const createSamplePrizes = (): Prize[] => {
    return [
      { text: "아이폰15_삼성전자 이재용 회장님 5개" },
      { text: "갤럭시S24_LG전자 조성진 대표님 3개" },
      { text: "에어팟_현대자동차 장재훈 사장님 10개" },
      { text: "맥북프로_SK하이닉스 곽노정 대표님 2개" },
      { text: "아이패드_네이버 최수연 대표님 4개" },
    ];
  };

  const [participants, setParticipants] = useState<Participant[]>(createSampleData());
  const [prizes, setPrizes] = useState<Prize[]>(createSamplePrizes());
  const [winners, setWinners] = useState<Winner[]>([]);
  const [drawCount, setDrawCount] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPrizeIndex, setCurrentPrizeIndex] = useState(0);
  const [prizeResults, setPrizeResults] = useState<{ [prizeIndex: number]: string[] }>({});
  const [animatingNumbers, setAnimatingNumbers] = useState<string[]>([]);


  // 번호 파일 업로드 처리
  const handleNumberFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const numbers: string[] = [];
        jsonData.forEach((row: any) => {
          if (row[0] && row[0].toString().trim()) {
            numbers.push(row[0].toString().trim());
          }
        });

        if (numbers.length === 0) return;

        const newParticipants: Participant[] = numbers.map(number => ({
          number,
          isWinner: false,
        }));

        setParticipants(newParticipants);
        setWinners([]);
        setPrizeResults({});
      } catch (error) {
        console.error('파일 읽기 오류');
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  // 상품 파일 업로드 처리
  const handlePrizeFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const prizeTexts: string[] = [];
        jsonData.forEach((row: any) => {
          if (row[0] && row[0].toString().trim()) {
            prizeTexts.push(row[0].toString().trim());
          }
        });

        if (prizeTexts.length === 0) return;

        const newPrizes: Prize[] = prizeTexts.map(text => ({ text }));
        setPrizes(newPrizes);
      } catch (error) {
        console.error('파일 읽기 오류');
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  // 추첨 인원수 조정
  const adjustDrawCount = (delta: number) => {
    const newCount = Math.max(1, drawCount + delta);
    setDrawCount(newCount);
  };

  // 샘플 데이터 로드 (리셋)
  const loadSampleData = () => {
    const newParticipants = createSampleData();
    const newPrizes = createSamplePrizes();
    
    setParticipants(newParticipants);
    setPrizes(newPrizes);
    setWinners([]);
    setCurrentPrizeIndex(0);
    setPrizeResults({});
  };

  // 다음 상품으로 이동
  const nextPrize = () => {
    if (currentPrizeIndex < prizes.length - 1) {
      setCurrentPrizeIndex(currentPrizeIndex + 1);
    }
  };

  // 이전 상품으로 이동
  const prevPrize = () => {
    if (currentPrizeIndex > 0) {
      setCurrentPrizeIndex(currentPrizeIndex - 1);
    }
  };

  // 번호 회전 애니메이션
  const startNumberAnimation = () => {
    const availableParticipants = participants.filter(p => !p.isWinner);
    const animationDuration = 2000; // 2초
    const intervalTime = 100; // 0.1초마다 변경
    
    const interval = setInterval(() => {
      const randomNumbers = Array.from({ length: drawCount }, () => {
        const randomIndex = Math.floor(Math.random() * availableParticipants.length);
        return availableParticipants[randomIndex].number;
      });
      setAnimatingNumbers(randomNumbers);
    }, intervalTime);

    setTimeout(() => {
      clearInterval(interval);
      setAnimatingNumbers([]);
    }, animationDuration);

    return animationDuration;
  };

  // 추첨 실행
  const performDraw = async () => {
    const availableParticipants = participants.filter(p => !p.isWinner);
    
    if (availableParticipants.length === 0 || prizes.length === 0 || currentPrizeIndex >= prizes.length) {
      return;
    }

    if (drawCount > availableParticipants.length) {
      return;
    }

    setIsDrawing(true);
    
    // 애니메이션 시작
    const animationDuration = startNumberAnimation();
    
    // 애니메이션 완료 후 결과 표시
    setTimeout(() => {
      const shuffledParticipants = [...availableParticipants].sort(() => Math.random() - 0.5);
      const selectedParticipants = shuffledParticipants.slice(0, drawCount);
      const selectedNumbers = selectedParticipants.map(p => p.number);
      
      // 현재 상품에 대한 당첨번호 저장
      const newPrizeResults = {
        ...prizeResults,
        [currentPrizeIndex]: selectedNumbers
      };
      setPrizeResults(newPrizeResults);
      
      // 당첨자 상태 업데이트
      const updatedParticipants = participants.map(p => 
        selectedNumbers.includes(p.number) ? { ...p, isWinner: true } : p
      );
      
      const newWinners: Winner[] = [
        ...winners,
        ...selectedNumbers.map((number, index) => ({
          number,
          prizeText: prizes[currentPrizeIndex]?.text || '상품 정보 없음',
          order: winners.length + index + 1
        }))
      ];
      
      setParticipants(updatedParticipants);
      setWinners(newWinners);
      setIsDrawing(false);
      
      // 로컬 스토리지에 저장
      localStorage.setItem('lotteryWinners', JSON.stringify(newWinners));
    }, animationDuration);
  };

  // 결과 초기화
  const resetResults = () => {
    const resetParticipants = participants.map(p => ({ ...p, isWinner: false }));
    setParticipants(resetParticipants);
    setWinners([]);
    setCurrentPrizeIndex(0);
    setPrizeResults({});
    localStorage.removeItem('lotteryWinners');
  };

  // 결과 다운로드
  const downloadResults = () => {
    if (winners.length === 0) return;

    const ws = XLSX.utils.json_to_sheet(winners.map((w) => ({
      '순번': w.order,
      '당첨번호': w.number,
      '상품정보': w.prizeText,
    })));
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '당첨결과');
    
    const fileName = `유진그룹_이태원111_추첨결과_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const availableParticipants = participants.filter(p => !p.isWinner);

  return (
    <div className="min-h-screen space-background p-4">
      {/* 별들 */}
      <div className="stars">
        {Array.from({ length: 15 }, (_, i) => (
          <div key={i} className="star" />
        ))}
      </div>
      
      <div className="w-full max-w-[1400px] mx-auto relative z-10 pt-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mt-2 mb-1 drop-shadow-lg">유진그룹 이태원111 준공식</h1>
        </div>

        {/* 메인 추첨 영역 */}
        <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30 shadow-2xl mb-8">
          <CardContent className="p-8">
            {/* 상품 표시 영역 */}
            <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-xl p-8 min-h-[400px] border border-purple-500/30 backdrop-blur-sm w-full mb-6">
              {isDrawing ? (
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-4 animate-pulse">
                    {animatingNumbers.join(' • ')}
                  </div>
                  <p className="text-purple-200 text-lg">✨ 추첨 중... ✨</p>
                </div>
              ) : (
                <div className="text-center space-y-6">
                  {/* 현재 상품 표시 */}
                  {prizes.length > 0 && currentPrizeIndex < prizes.length ? (
                    <div>
                      <h3 className="text-3xl font-bold text-yellow-300 mb-6">🎁 상품추첨 🎁</h3>
                      <div className="bg-black/30 rounded-lg p-6 border border-yellow-500/30 mb-6">
                        <div className="text-2xl text-yellow-300 font-semibold">
                          {prizes[currentPrizeIndex].text}
                        </div>
                      </div>
                      
                      {/* 현재 상품의 당첨번호 표시 */}
                      {prizeResults[currentPrizeIndex] && (
                        <div className="space-y-4">
                          <h4 className="text-xl font-bold text-white">🌟 당첨번호 🌟</h4>
                          <div className="flex flex-wrap justify-center gap-6">
                            {prizeResults[currentPrizeIndex].map((number, index) => (
                              <div key={index} className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-6 text-center winner-glow">
                                <div className="text-3xl font-bold text-black">
                                  {number}
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-yellow-300 text-lg">🎊 축하합니다! 🎊</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <Shuffle className="mx-auto h-16 w-16 mb-4 opacity-50" />
                      <p className="text-xl">추첨</p>
                      <p className="text-sm mt-2 opacity-70">번호 파일과 상품 파일 업로드</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 추첨 컨트롤 - 하단으로 이동 */}
            <div className="flex items-center justify-between">
              {/* 좌측: 상품 네비게이션 */}
              <div className="flex items-center gap-4">
                <span className="text-white text-sm">상품:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPrize}
                  disabled={currentPrizeIndex <= 0}
                  className="border-purple-400 text-white hover:bg-purple-500/20 h-8 px-3"
                >
                  이전
                </Button>
                <div className="text-white text-sm">
                  {prizes.length > 0 ? `${currentPrizeIndex + 1} / ${prizes.length}` : '0 / 0'}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPrize}
                  disabled={currentPrizeIndex >= prizes.length - 1}
                  className="border-purple-400 text-white hover:bg-purple-500/20 h-8 px-3"
                >
                  다음
                </Button>
              </div>

              {/* 중앙: 추첨 인원수 */}
              <div className="flex items-center gap-4">
                <span className="text-white text-sm">추첨 인원수:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => adjustDrawCount(-1)}
                  disabled={drawCount <= 1}
                  className="border-purple-400 text-white hover:bg-purple-500/20 h-8 w-8 p-0"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <div className="text-xl font-bold w-12 text-center text-white">
                  {drawCount}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => adjustDrawCount(1)}
                  className="border-purple-400 text-white hover:bg-purple-500/20 h-8 w-8 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {/* 우측: 추첨 버튼 */}
              <Button
                onClick={performDraw}
                disabled={isDrawing || availableParticipants.length === 0 || prizes.length === 0 || currentPrizeIndex >= prizes.length}
                className="h-12 px-8 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border border-purple-400 shadow-lg shadow-purple-500/25"
              >
                {isDrawing ? '✨ 추첨 중... ✨' : '🚀 추첨 시작 🚀'}
              </Button>
            </div>

              {/* 하단 버튼들 */}
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={resetResults}
                  disabled={winners.length === 0}
                  className="flex-1 border-purple-400 text-white hover:bg-purple-500/20"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  초기화
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadResults}
                  disabled={winners.length === 0}
                  className="flex-1 border-purple-400 text-white hover:bg-purple-500/20"
                >
                  <Download className="h-4 w-4 mr-2" />
                  저장
                </Button>
              </div>
            </CardContent>
          </Card>

        {/* 하단: 당첨자 리스트 (스크롤해야 보임) */}
        <div className="mt-16 pt-16">
          <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30 shadow-2xl">
            <CardHeader className="pb-6">
              <CardTitle className="text-center text-white text-2xl">
                🏆 당첨자 명단 🏆
                <Badge variant="secondary" className="bg-purple-600 text-white ml-4">{winners.length}명</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {winners.map((winner) => (
                  <div
                    key={`${winner.number}-${winner.order}`}
                    className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-400/50 backdrop-blur-sm p-3"
                  >
                    <div className="text-center space-y-1">
                      <div className="text-lg font-bold text-white">
                        {winner.number}
                      </div>
                      <div className="text-xs text-yellow-300 bg-black/30 rounded p-1 truncate" title={winner.prizeText}>
                        {winner.prizeText.length > 15 ? winner.prizeText.substring(0, 15) + '...' : winner.prizeText}
                      </div>
                      <Badge variant="secondary" className="bg-yellow-500 text-black font-bold text-xs">
                        #{winner.order}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              {winners.length === 0 && (
                <div className="text-center text-purple-200 py-8">
                  🌌 아직 당첨자가 없습니다 🌌
                </div>
              )}

            </CardContent>
          </Card>
        </div>

        {/* 우측 하단 파일 업로드 - 작은 텍스트 */}
        <div className="fixed bottom-4 right-4 z-10">
          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-purple-500/30">
            <div className="text-center space-y-2">
              <label htmlFor="number-file-upload" className="cursor-pointer block">
                <span className="text-xs text-purple-200 hover:text-white opacity-70 hover:opacity-100">
                  📊 번호 파일
                </span>
                <input
                  id="number-file-upload"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleNumberFileUpload}
                  className="hidden"
                />
              </label>
              <label htmlFor="prize-file-upload" className="cursor-pointer block">
                <span className="text-xs text-purple-200 hover:text-white opacity-70 hover:opacity-100">
                  🎁 상품 파일
                </span>
                <input
                  id="prize-file-upload"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handlePrizeFileUpload}
                  className="hidden"
                />
              </label>
              <button
                onClick={loadSampleData}
                className="text-xs text-purple-300 hover:text-white opacity-60 hover:opacity-100 block w-full"
              >
                샘플 데이터
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;