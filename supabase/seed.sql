insert into public.interests (name, category) values
('웹툰','콘텐츠'), ('애니','콘텐츠'), ('게임','게임'), ('아이돌','음악팬덤'),
('캐릭터','캐릭터'), ('피규어','굿즈'), ('버튜버','방송'), ('굿즈','커머스'),
('포켓몬','게임'), ('BTS','아이돌'), ('스텔라이브','버튜버'), ('롤','게임')
on conflict (name) do nothing;

insert into public.galleries (name, slug, description, category, follower_count, post_count) values
('산리오 갤러리','sanrio','쿠로미, 마이멜로디, 시나모롤 굿즈와 재입고 정보','캐릭터',12430,842),
('포켓몬 갤러리','pokemon','포켓몬 카드, 키링, 인형, 팝업스토어 소식','게임',9870,620),
('원피스 갤러리','onepiece','피규어, 점프샵, 한정판 예약 정보','애니',7460,411),
('웹툰 굿즈 갤러리','webtoon-goods','웹툰 단행본 특전과 팝업 굿즈 후기','웹툰',5320,359),
('BTS 갤러리','bts','포토카드, 앨범 특전, 공식 MD 구매 정보','아이돌',15110,1203),
('스텔라이브 갤러리','stellive','버튜버 굿즈와 콜라보 카페 이야기','버튜버',4310,288),
('롤 갤러리','lol','롤드컵 굿즈와 팀 유니폼 교환 정보','게임',6920,503)
on conflict (slug) do nothing;
