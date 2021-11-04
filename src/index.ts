import './index.sass';
import netflixCsv from './NetflixViewingHistory.csv';

interface Base {
  name: string
  date: Date,
}
type SeriesContent = {
  name: string;
  date: Date;
};

interface Series extends Base {
  type: 'series'
  content: {
    [key: string]: SeriesContent[];
  }
}
interface Movie extends Base {
  type: 'movie',
}
type Data = Movie | Series

interface DataObject {
  [key: string]: Data;
}

type Sort = 'nameAscending' | 'nameDescending' | 'dateAscending' | 'dateDescending';

interface Filter {
  name?: string,
  type?: Data['type']
}

const LIST = document.createElement('div')
LIST.style.display = 'flex'
LIST.style.flexDirection = 'column'
LIST.style.gap = '0.2rem'
LIST.style.padding = '1rem'
document.body.appendChild(LIST)
const DATA = parseCsv(netflixCsv)
const FILTER: Filter = {}
let SORT: Sort = 'dateDescending'
const FILTER_EL = createFilterEl();
render(DATA, FILTER, SORT)

function render(data: DataObject, filter: Filter, sort: Sort) {
  let renderData = (Object.values(data) as Data[])
  const fName = filter.name;
  if (fName) {
    renderData = renderData.filter((v) => v.name.toLowerCase().startsWith(fName.toLowerCase()))
  }
  const fType = filter.type;
  if (fType) {
    renderData = renderData.filter((v) => v.type === fType)
  }

  renderData.sort(getSortFunc(sort))
  LIST.textContent = ''

  const bar = listEl()
  const name = document.createElement('div')
  if (sort === 'nameAscending' || sort === 'nameDescending') {
    name.textContent = sort === 'nameAscending' ? 'Title ▼' : 'Title ▲'
  } else {
    name.textContent = 'Title'
  }
  name.onclick = () => {
    if (SORT === 'nameAscending') {
      SORT = 'nameDescending'
    } else {
      SORT = 'nameAscending'
    }
    render(DATA, FILTER, SORT)
  }
  const date = document.createElement('div')
  if (sort === 'dateAscending' || sort === 'dateDescending') {
    date.textContent = sort === 'dateAscending' ? 'Date ▼' : 'Date ▲'
  } else {
    date.textContent = 'Date'
  }
  date.onclick = () => {
    if (SORT === 'dateAscending') {
      SORT = 'dateDescending'
    } else {
      SORT = 'dateAscending'
    }
    render(DATA, FILTER, SORT)
  }
  date.style.cursor = 'pointer'
  name.style.cursor = 'pointer'
  bar.appendChild(name)
  bar.appendChild(date)
  bar.classList.add('list-el-main')
  LIST.appendChild(FILTER_EL)
  LIST.appendChild(bar)

  for (let i = 0; i < renderData.length; i++) {
    const data = renderData[i];
    const mainEl = listEl()
    const el = document.createElement('div')
    const el2 = document.createElement('div')
    el2.className = 'list-seasons'
    el.className = 'list-el-main'
    const name = document.createElement('span')
    name.onclick = () => window.open(`https://www.netflix.com/search?q=${data.name}`, "_blank");
    name.style.cursor = "pointer"
    el.appendChild(name)
    name.textContent = data.name

    const date = document.createElement('span')
    date.textContent = data.date.toDateString()
    el.appendChild(date)

    mainEl.appendChild(el)
    if (data.type === 'series') {
      mainEl.appendChild(el2)

      for (const key in data.content) {
        if (Object.prototype.hasOwnProperty.call(data.content, key)) {
          const season = data.content[key];
          const seasonEl = document.createElement('div')

          seasonEl.className = 'list-season'
          seasonEl.textContent = key
          const episodesEl = document.createElement('div')
          episodesEl.className = 'list-episodes'
          episodesEl.style.display = 'none'
          for (let i = 0; i < season.length; i++) {
            const episode = season[i];
            const episodeEl = document.createElement('div')
            episodeEl.className = 'list-el-main'
            const episodeName = document.createElement('span')
            episodeName.textContent = episode.name
            episodeEl.appendChild(episodeName)
            const episodeDate = document.createElement('span')
            episodeDate.textContent = episode.date.toDateString()
            episodeEl.appendChild(episodeDate)
            episodesEl.appendChild(episodeEl)
          }
          seasonEl.onclick = () => {
            if (episodesEl.style.display === 'block') {
              episodesEl.style.display = 'none'
            } else {
              episodesEl.style.display = 'block'
            }
          }
          seasonEl.appendChild(episodesEl)
          el2.appendChild(seasonEl)
        }
      }
    }

    LIST.appendChild(mainEl)
  }

}

function listEl() {
  const el = document.createElement('div')
  el.className = "list-el"
  return el
}

function parseCsv(csv: string): DataObject {
  const data: DataObject = {}
  const rawData = csv.split(/\n/)
  for (let i = 1; i < rawData.length; i++) {

    const text = rawData[i];
    if (text) {

      const [title, dateString] = text.replace(/^"/, '').replace(/"$/, '').split('","')

      const DATE = new Date()

      DATE.setFullYear(+ dateString.substring(6, 10))
      DATE.setMonth(+ dateString.substring(3, 5))
      DATE.setDate(+ dateString.substring(0, 2))
      DATE.setHours(0)
      DATE.setMinutes(0)
      DATE.setSeconds(0)
      DATE.setMilliseconds(0)

      const seriesInfo = /(.+): ?(.+): ?(.+)$/.exec(title);

      if (seriesInfo) {
        let [_, name, season, episodeName] = seriesInfo;

        let series: Data | undefined = data[name];

        if (series && series.type === 'movie') {
          name = `${name} (Series)`
          series = data[name] as Series | undefined;
        }

        if (series) {

          pushContent(series.content, season, episodeName, DATE)
          if (DATE.getTime() < series.date.getTime()) {
            series.date = DATE
          }
        } else {
          const content: Series['content'] = {}

          pushContent(content, season, episodeName, DATE)
          data[name] = { type: 'series', content: content, name: name, date: DATE }
        }
      } else {
        if (title.trim() && !title.startsWith(" : Episode")) {
          data[title] = { type: 'movie', date: DATE, name: title }
        }
      }
    }

  }
  return data
}

function pushContent(content: Series['content'], season: string, episode: string, date: Date) {
  if (!content[season]) {
    content[season] = []
  }
  content[season].push({ date: date, name: episode })
}

function createFilterEl() {
  const FILTER_EL = document.createElement('div');
  FILTER_EL.className = 'list-el';
  FILTER_EL.classList.add('list-el-main');
  const SEARCH = document.createElement('input');
  SEARCH.oninput = () => {
    FILTER.name = SEARCH.value
    render(DATA, FILTER, SORT)
    SEARCH.focus()
  }
  SEARCH.type = 'text';
  FILTER_EL.appendChild(SEARCH);
  const FILTER_TYPE = document.createElement('div');

  const movieType = document.createElement('input');
  movieType.type = 'radio';
  movieType.name = 'filter-type';
  movieType.id = 'filter-movie';
  const movieTypeName = document.createElement('label');
  movieTypeName.textContent = 'Movies';
  movieTypeName.htmlFor = 'filter-movie';

  const seriesType = document.createElement('input');
  seriesType.type = 'radio';
  seriesType.name = 'filter-type';
  seriesType.id = 'filter-series';
  const seriesTypeName = document.createElement('label');
  seriesTypeName.textContent = 'Series';
  seriesTypeName.htmlFor = 'filter-series';

  const noneType = document.createElement('input');
  noneType.type = 'radio';
  noneType.name = 'filter-type';
  noneType.id = 'filter-none';
  noneType.checked = true
  const noneTypeName = document.createElement('label');
  noneTypeName.textContent = 'None';
  noneTypeName.htmlFor = 'filter-none';
  const change = () => {
    if (noneType.checked) {
      FILTER.type = undefined;
    } else if (seriesType.checked) {
      FILTER.type = 'series'
    } else if (movieType.checked) {
      FILTER.type = 'movie'
    }
    render(DATA, FILTER, SORT)
  };
  noneType.onchange = change
  seriesType.onchange = change
  movieType.onchange = change
  FILTER_TYPE.appendChild(movieType);
  FILTER_TYPE.appendChild(movieTypeName);
  FILTER_TYPE.appendChild(seriesType);
  FILTER_TYPE.appendChild(seriesTypeName);
  FILTER_TYPE.appendChild(noneType);
  FILTER_TYPE.appendChild(noneTypeName);
  FILTER_EL.appendChild(FILTER_TYPE);
  return FILTER_EL;
}


function getSortFunc(sort: Sort): (a: Data, b: Data) => number {
  switch (sort) {
    case 'dateAscending':
      return (a, b) => {
        if (a.date.getTime() > b.date.getTime()) return 1;
        if (a.date.getTime() < b.date.getTime()) return -1;
        return 0;
      }
    case 'dateDescending':
      return (a, b) => {
        if (a.date.getTime() > b.date.getTime()) return -1;
        if (a.date.getTime() < b.date.getTime()) return 1;
        return 0;
      }
    case 'nameAscending':
      return (a, b) => {
        if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
        if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
        return 0;
      }
    case 'nameDescending':
      return (a, b) => {
        if (a.name.toLowerCase() > b.name.toLowerCase()) return -1;
        if (a.name.toLowerCase() < b.name.toLowerCase()) return 1;
        return 0;
      }
  }
}