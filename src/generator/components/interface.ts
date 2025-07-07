// -------------------
// filename: src/generator/components/interface.ts
// -------------------
import { UidManager } from '../uid-manager';
import { XmlElement } from '../xml-builder';
import { XmlComponent } from './xml-component';

// CORRECTIE: Deze klasse is aangepast om de SIMPELE commentaarstructuur te genereren.
class Subelement extends XmlComponent {
    constructor(uidManager: UidManager, private path: string, private commentText: string) {
        super(uidManager);
    }
    toXml(pretty: boolean = true, level: number = 0): string {
        const simpleTextElement = new XmlElement('MultiLanguageText', this.commentText)
            .attr('Lang', 'nl-NL');
            
        const commentElement = new XmlElement('Comment')
            .add(simpleTextElement);

        return new XmlElement('Subelement')
            .attr('Path', this.path)
            .add(commentElement)
            .toString(pretty, level);
    }
}

class Member extends XmlComponent {
    private subelements: Subelement[] = [];
    constructor(uidManager: UidManager, private name: string, private datatype: string, private remanence: string = "") {
        super(uidManager);
    }

    addSubelement(path: string, comment: string) {
        this.subelements.push(new Subelement(this.uidManager, path, comment));
    }

    toXml(pretty: boolean = true, level: number = 0): string {
        const memberEl = new XmlElement('Member')
            .attr('Name', this.name)
            .attr('Datatype', this.datatype);
        if (this.remanence) {
            memberEl.attr('Remanence', this.remanence);
        }
        this.subelements.forEach(sub => memberEl.addRaw(sub.toXml(pretty, level + 1)));
        return memberEl.toString(pretty, level);
    }
}

class Section extends XmlComponent {
    private members: Member[] = [];
    constructor(uidManager: UidManager, public readonly name: string) {
        super(uidManager);
    }

    addMember(name: string, datatype: string, remanence: string = ""): Member {
        const member = new Member(this.uidManager, name, datatype, remanence);
        this.members.push(member);
        return member;
    }

    getMembers() {
        return this.members;
    }

    toXml(pretty: boolean = true, level: number = 0): string {
        const sectionEl = new XmlElement('Section').attr('Name', this.name);
        this.members.forEach(m => sectionEl.addRaw(m.toXml(pretty, level + 1)));
        return sectionEl.toString(pretty, level);
    }
}

export class Interface extends XmlComponent {
    public sections = {
        Input: new Section(this.uidManager, 'Input'),
        Output: new Section(this.uidManager, 'Output'),
        InOut: new Section(this.uidManager, 'InOut'),
        Static: new Section(this.uidManager, 'Static'),
        Temp: new Section(this.uidManager, 'Temp'),
        Constant: new Section(this.uidManager, 'Constant'),
    };

    constructor(uidManager: UidManager) {
        super(uidManager);
    }

    toXml(pretty: boolean = true, level: number = 0): string {
        const sectionsEl = new XmlElement('Sections')
            .attr('xmlns', 'http://www.siemens.com/automation/Openness/SW/Interface/v5');
        
        Object.values(this.sections).forEach(s => {
            if (s.getMembers().length > 0) {
                 sectionsEl.addRaw(s.toXml(pretty, level + 1));
            } else {
                 sectionsEl.add(new XmlElement('Section').attr('Name', s.name));
            }
        });

        return new XmlElement('Interface')
            .add(sectionsEl)
            .toString(pretty, level);
    }
}
