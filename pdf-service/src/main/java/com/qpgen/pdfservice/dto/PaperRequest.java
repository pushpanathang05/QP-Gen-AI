package com.qpgen.pdfservice.dto;

import java.util.List;

public class PaperRequest {
  private String title;
  private String examType;
  private Course course;
  private Template template;
  private List<Section> sections;

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getExamType() {
    return examType;
  }

  public void setExamType(String examType) {
    this.examType = examType;
  }

  public Course getCourse() {
    return course;
  }

  public void setCourse(Course course) {
    this.course = course;
  }

  public Template getTemplate() {
    return template;
  }

  public void setTemplate(Template template) {
    this.template = template;
  }

  public List<Section> getSections() {
    return sections;
  }

  public void setSections(List<Section> sections) {
    this.sections = sections;
  }

  public static class Course {
    private String courseId;
    private String code;
    private String title;
    private String department;
    private Integer semester;

    public String getCourseId() {
      return courseId;
    }

    public void setCourseId(String courseId) {
      this.courseId = courseId;
    }

    public String getCode() {
      return code;
    }

    public void setCode(String code) {
      this.code = code;
    }

    public String getTitle() {
      return title;
    }

    public void setTitle(String title) {
      this.title = title;
    }

    public String getDepartment() {
      return department;
    }

    public void setDepartment(String department) {
      this.department = department;
    }

    public Integer getSemester() {
      return semester;
    }

    public void setSemester(Integer semester) {
      this.semester = semester;
    }
  }

  public static class Template {
    private String id;
    private String name;
    private java.util.Map<String, Object> format;

    public String getId() {
      return id;
    }

    public void setId(String id) {
      this.id = id;
    }

    public String getName() {
      return name;
    }

    public void setName(String name) {
      this.name = name;
    }

    public java.util.Map<String, Object> getFormat() {
      return format;
    }

    public void setFormat(java.util.Map<String, Object> format) {
      this.format = format;
    }
  }

  public static class Section {
    private String sectionId;
    private String title;
    private String instructions;
    private List<Question> questions;

    public String getSectionId() {
      return sectionId;
    }

    public void setSectionId(String sectionId) {
      this.sectionId = sectionId;
    }

    public String getTitle() {
      return title;
    }

    public void setTitle(String title) {
      this.title = title;
    }

    public String getInstructions() {
      return instructions;
    }

    public void setInstructions(String instructions) {
      this.instructions = instructions;
    }

    public List<Question> getQuestions() {
      return questions;
    }

    public void setQuestions(List<Question> questions) {
      this.questions = questions;
    }
  }

  public static class Question {
    private String questionNumber;
    private String topic;
    private String btlLevel;
    private Integer marks;
    private String questionText;

    public String getQuestionNumber() {
      return questionNumber;
    }

    public void setQuestionNumber(String questionNumber) {
      this.questionNumber = questionNumber;
    }

    public String getTopic() {
      return topic;
    }

    public void setTopic(String topic) {
      this.topic = topic;
    }

    public String getBtlLevel() {
      return btlLevel;
    }

    public void setBtlLevel(String btlLevel) {
      this.btlLevel = btlLevel;
    }

    public Integer getMarks() {
      return marks;
    }

    public void setMarks(Integer marks) {
      this.marks = marks;
    }

    public String getQuestionText() {
      return questionText;
    }

    public void setQuestionText(String questionText) {
      this.questionText = questionText;
    }
  }
}
