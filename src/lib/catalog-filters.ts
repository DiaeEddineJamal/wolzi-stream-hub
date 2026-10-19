interface TrendingRecord {media_type?:string;genre_ids?:number[];original_language?:string;release_date?:string;first_air_date?:string;vote_average?:number}
interface TrendingFilters {mediaType:string;genre:string;year:string;minRating:string}
export function matchesTrendingFilters(item:TrendingRecord,filter:TrendingFilters){
  if(!['movie','tv'].includes(item.media_type||''))return false;
  if(filter.mediaType==='anime'){
    if(!item.genre_ids?.includes(16)||item.original_language!=='ja')return false;
  }else if(filter.mediaType!=='all'&&item.media_type!==filter.mediaType)return false;
  if(filter.genre!=='all'){
    const id=Number(filter.genre);
    const tvEquivalent=item.media_type==='tv'?({28:10759,12:10759,14:10765,878:10765} as Record<number,number>)[id]:undefined;
    if(!item.genre_ids?.some(genre=>genre===id||genre===tvEquivalent))return false;
  }
  if(filter.minRating!=='all'&&(item.vote_average||0)<Number(filter.minRating))return false;
  if(filter.year!=='all'){
    const year=Number((item.release_date||item.first_air_date||'').slice(0,4));
    if(!year)return false;
    if(filter.year==='2020s'){if(year<2020||year>2029)return false;}
    else if(filter.year==='2010s'){if(year<2010||year>2019)return false;}
    else if(filter.year==='classic'){if(year>=2010)return false;}
    else if(year!==Number(filter.year))return false;
  }
  return true;
}
